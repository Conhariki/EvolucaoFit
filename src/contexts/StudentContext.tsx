'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';

interface Student {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface StudentContextType {
  selectedStudentId: string | null;
  students: Student[];
  setSelectedStudentId: (id: string | null) => void;
  refreshStudents: () => Promise<void>;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const handleSetSelectedStudentId = (id: string | null) => {
    setSelectedStudentId(id);
    if (typeof window !== 'undefined') {
      if (id) {
        sessionStorage.setItem('selectedStudentId', id);
      } else {
        sessionStorage.removeItem('selectedStudentId');
      }
    }
  };

  const fetchStudents = async () => {
    if (status !== 'authenticated') return;

    try {
      const response = await axios.get('/api/students', {
        withCredentials: true,
      });
      const fetchedStudents = response.data;
      setStudents(fetchedStudents);

      // Se não houver aluno selecionado e houver alunos disponíveis, seleciona o primeiro
      if (!selectedStudentId && fetchedStudents.length > 0) {
        const studentId = typeof window !== 'undefined' ? sessionStorage.getItem('selectedStudentId') : null;
        if (studentId && fetchedStudents.some((s: Student) => s.id === studentId)) {
          handleSetSelectedStudentId(studentId);
        } else {
          handleSetSelectedStudentId(fetchedStudents[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <StudentContext.Provider
      value={{
        selectedStudentId,
        students,
        setSelectedStudentId: handleSetSelectedStudentId,
        refreshStudents: fetchStudents,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}

