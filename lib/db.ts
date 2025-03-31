import {
	getDoc,
	addDoc,
	doc,
	collection,
	getDocs,
	query,
	where,
	setDoc,
} from "@firebase/firestore";
import { db } from "@/lib/firebase";

// get all workspaces of UID
export async function getWorkspaceByUID(UID: string) {
    const documents = collection(db, `workspaces`);
    
}