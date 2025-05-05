import * as dotenv from 'dotenv';
dotenv.config({ path: 'lib/.env' });

import { db } from './firebase';
import { collection, getDocs, updateDoc, deleteDoc, serverTimestamp, doc, setDoc, addDoc } from 'firebase/firestore';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getVideoSize(videoUrl: string): Promise<number> {
    videoUrl = `${process.env.NEXT_PUBLIC_AWS_CDN_URL}${videoUrl}`
    const response = await fetch(videoUrl, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength) : 0;
}

async function getVideoDuration(videoUrl: string): Promise<number> {
    videoUrl = `${process.env.NEXT_PUBLIC_AWS_CDN_URL}${videoUrl}`
    try {
        const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoUrl}"`);
        return parseFloat(stdout.trim()) || 0;
    } catch (error) {
        console.error('Error getting video duration:', error);
        return 0;
    }
}

async function getVideoType(videoUrl: string): Promise<string> {
    videoUrl = `${process.env.NEXT_PUBLIC_AWS_CDN_URL}${videoUrl}`
    const extension = videoUrl.split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'webm', 'mov'].includes(extension) ? extension : 'mp4';
}

async function migrateProjects() {
    console.log('Starting project migration...');

    // Get all projects
    const projectsSnapshot = await getDocs(collection(db, 'projects'));
    console.log(`Found ${projectsSnapshot.size} projects`);

    for (const projectDoc of projectsSnapshot.docs) {
        try {
            const projectData = projectDoc.data();
            console.log(`Processing project: ${projectData.title || 'Untitled Project'}`);
            
        // Check for required videoUrl
        if (!projectData.videoUrl) {
            console.log(`Deleting project ${projectDoc.id} due to missing videoUrl`);
            await deleteDoc(projectDoc.ref);
            continue;
        }
        console.log("projectData.videoUrl", projectData.videoUrl)
        // check if project has a videoSize if not then get it
        let videoSize
        if (!projectData.videoSize) {
            videoSize = await getVideoSize(projectData.videoUrl);
            projectData.videoSize = videoSize;
        }
        console.log(`Video size: ${videoSize}`);

        // check if project has a videoDuration if not then get it
        let videoDuration
        if (!projectData.videoDuration) {
            videoDuration = await getVideoDuration(projectData.videoUrl);
            projectData.videoDuration = videoDuration;
        }
        console.log(`Video duration: ${videoDuration}`);
    
        // check if project has a videoType if not then get it
        let videoType
        if (!projectData.videoType) {
            videoType = await getVideoType(projectData.videoUrl);
            projectData.videoType = videoType;
        }
        console.log(`Video type: ${videoType}`);

        // Fix the project structure
        const updatedProject = {
            id: projectDoc.id || projectDoc.ref.id,
            videoUrl: projectData.videoUrl,
            thumbnail: projectData.thumbnail || await generateThumbnail(projectData.videoUrl),
            status: typeof projectData.status === 'string' ? projectData.status : 'In Progress',
            createdAt: projectData.createdAt || serverTimestamp(),
            updatedAt: projectData.updatedAt || serverTimestamp(),
            comments: projectData.comments || [],
            annotations: projectData.annotations || [],
            videoSize: projectData.videoSize || videoSize,
            videoDuration: projectData.videoDuration || videoDuration,
            videoType: projectData.videoType || videoType,
            progress: projectData.progress || 0,
            dueDate: projectData.dueDate || serverTimestamp(),
        };

        // Update the project document
        await updateDoc(projectDoc.ref, updatedProject);
        console.log(`SAVED`);

        } catch (error) {
            console.error(`Error processing project ${projectDoc.id}:`, error);
        }
    }

    console.log('Migration completed successfully!');
}

// Helper function to generate thumbnail from video URL
async function generateThumbnail(videoUrl: string): Promise<string> {
    // This is a placeholder - you'll need to implement actual thumbnail generation
    // For now, we'll return a default thumbnail URL
    return 'https://via.placeholder.com/150';
}

// // Run the migration
// migrateProjects();

async function deleteUndefinedProjects() {
    try {
        const projectsSnapshot = await getDocs(collection(db, 'projects'));
        console.log(`Found ${projectsSnapshot.size} projects`);

        for (const projectDoc of projectsSnapshot.docs) {

            if (!projectDoc.data().videoUrl && !projectDoc.data().videoUrl.startsWith('https://')) {
                console.log(`Deleting project ${projectDoc.id} due to missing videoUrl`);
                await deleteDoc(projectDoc.ref);
            }
            // if accessign videu from aws gives error 403 delete the project document
            try {
                const videoUrl = projectDoc.data().videoUrl;
                const videoSize = await getVideoSize(videoUrl);
                if (videoSize === 0) {
                    console.log(`Deleting project ${projectDoc.id} due to 403 error`);
                    await deleteDoc(projectDoc.ref);        
                }
            } catch (error) {
                console.error(`Error processing project ${projectDoc.id}:`, error);
            }
        }
    } catch (error) {
        console.error(`Error processing project `);
    }
}

// // Run the migration
// deleteUndefinedProjects()

interface ProjectVersion {
    id: string;
    thumbnail: string;
    version: number;
    videoUrl: string;
    videoSize: number;
    videoType: string;
}

interface Project {
    title: string;
    status: string;
    size: number;
    progress: number;
    createdAt: any; // Firestore Timestamp
    updatedAt: any; // Firestore Timestamp
    numVersions: number;
    dueDate: any; // Firestore Timestamp
    versions: ProjectVersion[];
}

async function fixWorkspaceFormatting() {
    const workspacesSnapshot = await getDocs(collection(db, 'workspaces'));
    console.log(`Found ${workspacesSnapshot.size} workspaces`);

    for (const workspaceDoc of workspacesSnapshot.docs) {
        const workspaceData = workspaceDoc.data();
        console.log(`Processing workspace: ${workspaceData.name}`);
        
        // Fix collaborators format
        if (workspaceData.members && !workspaceData.collaborators) {
            workspaceData.collaborators = [];
            for (const member of workspaceData.members) {
                workspaceData.collaborators.push({email: member, permission: 'viewer'});
            }
            delete workspaceData.members;
        }
        console.log(`Updated collaborators: ${workspaceData.collaborators}`);

        // Fix projects format
        if (workspaceData.projects) {
            const updatedProjects = await Promise.all(workspaceData.projects.map(async (project: any) => {
                const now = new Date();
                // Ensure project has required fields
                const updatedProject: Project = {
                    title: project.title || 'Untitled Project',
                    status: project.status || 'In Progress',
                    size: project.size || 0,
                    progress: project.progress || 0,
                    createdAt: project.createdAt || now,
                    updatedAt: project.updatedAt || now,
                    numVersions: project.numVersions || (project.versions ? project.versions.length : 1),
                    dueDate: project.dueDate || now,
                    versions: []
                };
                console.log(`Updated project`);

                // Handle versions
                if (!project.versions || project.versions.length === 0) {
                    // Create initial version if none exists
                    const videoUrl = project.videoUrl;
                    if (videoUrl) {
                        const videoSize = await getVideoSize(videoUrl);
                        const videoType = await getVideoType(videoUrl);
                        const thumbnail = await generateThumbnail(videoUrl);

                        updatedProject.versions = [{
                            id: project.id || workspaceDoc.id + '_v1',
                            thumbnail: thumbnail || '',
                            version: 1,
                            videoUrl: videoUrl,
                            videoSize: videoSize || 0,
                            videoType: videoType || ''
                        }];
                    }
                    console.log(`Added initial version`);
                } else {
                    // Format existing versions
                    updatedProject.versions = await Promise.all(project.versions.map(async (version: any, index: number) => {
                        const videoUrl = version.videoUrl;
                        const videoSize = version.videoSize || await getVideoSize(videoUrl);
                        const videoType = version.videoType || await getVideoType(videoUrl);
                        const thumbnail = version.thumbnail || await generateThumbnail(videoUrl);

                        return {
                            id: version.id || `${project.id || workspaceDoc.id}_v${index + 1}`,
                            thumbnail: thumbnail || '',
                            version: version.version || index + 1,
                            videoUrl: videoUrl,
                            videoSize: videoSize || 0,
                            videoType: videoType || ''
                        };
                    }));
                    console.log(`Formatted versions`);
                }
                console.log(`Formatted project`);
                return updatedProject;
            }));

            workspaceData.projects = updatedProjects;
            console.log(`Updated projects`);
        }

        const updatedWorkspace = {
            createdAt: workspaceData.createdAt || serverTimestamp(),
            description: workspaceData.description || '',
            name: workspaceData.name || 'Untitled Workspace',
            updatedAt: workspaceData.updatedAt || serverTimestamp(),
            collaborators: workspaceData.collaborators || [],
            projects: workspaceData.projects || [],
            size: workspaceData.size || 0,
            numMembers: workspaceData.numMembers || workspaceData.collaborators.length || 0,
        };
        
        // Update the workspace document
        await updateDoc(workspaceDoc.ref, updatedWorkspace);
        console.log(`Updated workspace: ${workspaceDoc.id}`);
    }
}

// Run the migration
// fixWorkspaceFormatting();

// Fix project versions in workspaces
async function fixVersions() {
    // for each workspace, get the projects
    // for each version in the project create a new version document in the workspace versions collection
    // update each version in a project within a workspace with the new version id
    // replace the version elements in the project with the new version ids
    const workspacesSnapshot = await getDocs(collection(db, 'workspaces'));
    console.log(`Found ${workspacesSnapshot.size} workspaces`);

    for (const workspaceDoc of workspacesSnapshot.docs) {
        const workspaceData = workspaceDoc.data();
        console.log(`Processing workspace: ${workspaceData.name}`);
        for (const project of workspaceData.projects) {
            let newVersions = [];
            if(project.versions && project.versions.length > 0) {
                for (const version of project.versions) {
                    const versionData = version
                    console.log(`Processing version: ${JSON.stringify(versionData)}`);
                    const versionRef = collection(db, 'workspaces', workspaceDoc.id, 'versions');
                    const newVersionId = await addDoc(versionRef, versionData);
                    // replace the version in project.versions with the new version id
                    newVersions.push(newVersionId);
                }
                // replace the versions in project.versions with the new version ids
                await updateDoc(project.ref, {
                    versions: newVersions
                });
            }
        }
        
    }
}

// fixVersions();