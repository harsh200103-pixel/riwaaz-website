import { NextResponse } from 'next/server';
import { db } from '../../../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    const snap = await getDocs(collection(db, "products"));
    const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack });
  }
}
