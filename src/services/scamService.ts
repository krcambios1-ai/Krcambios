import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';

export interface ScamReport {
  id?: string;
  number: string;
  name?: string;
  reason: string;
  date: any;
  status: 'verified' | 'pending' | 'suspicious';
  reporterUid?: string;
}

const COLLECTION_NAME = 'scam_reports';

export const reportScammer = async (report: Omit<ScamReport, 'id' | 'status' | 'reporterUid' | 'date'>) => {
  const newReport: Omit<ScamReport, 'id'> = {
    ...report,
    date: Timestamp.now(),
    status: 'pending',
    reporterUid: auth.currentUser?.uid || 'anonymous'
  };

  try {
    return await addDoc(collection(db, COLLECTION_NAME), newReport);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
  }
};

export const subscribeToReports = (callback: (reports: ScamReport[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as ScamReport));
    callback(reports);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
  });
};

export const searchReports = async (number: string) => {
  const q = query(collection(db, COLLECTION_NAME), where('number', '==', number));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ScamReport));
};
