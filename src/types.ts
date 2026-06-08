export interface PDFDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  githubUrl: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  downloadCount: number;
  fileData?: string; // Stored as base64 data string
}

export type Category = 'All' | 'Semester 1' | 'Semester 2' | 'Semester 3' | 'Semester 4' | 'Semester 5' | 'Semester 6' | 'Semester 7' | 'Semester 8';
