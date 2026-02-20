'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  useColorModeValue,
  Stack,
  Text,
  Avatar,
  useColorMode,
  Select,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useStudent } from '@/contexts/StudentContext';
import { useTheme } from '@/contexts/ThemeContext';

interface NavLinkProps {
  children: React.ReactNode;
  href: string;
  onClick?: () => void;
}

const NavLink = ({ children, href, onClick }: NavLinkProps) => (
  <Link href={href} passHref onClick={onClick}>
    <Text
      px={2}
      py={1}
      rounded={'md'}
      _hover={{
        textDecoration: 'none',
        bg: useColorModeValue('gray.200', 'gray.700'),
      }}
    >
      {children}
    </Text>
  </Link>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const { selectedStudentId, students, setSelectedStudentId } = useStudent();
  const bgMain = useColorModeValue('gray.50', 'gray.900');
  const bgHeader = useColorModeValue('white', 'gray.800');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return null;
  }

  return (
    <Box minH="100vh" bg={bgMain}>
      <Box bg={bgHeader} px={4} shadow="sm">
        <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
          <IconButton
            size={'md'}
            icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
            aria-label={'Open Menu'}
            display={{ md: 'none' }}
            onClick={isOpen ? onClose : onOpen}
          />
          <HStack spacing={8} alignItems={'center'}>
            <Box fontWeight="bold" fontSize="lg">
              EvoluçãoFit
            </Box>
            <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
              <NavLink href="/dashboard">Dashboard</NavLink>
              <NavLink href="/dashboard/measurements">Medições</NavLink>
              <NavLink href="/dashboard/photos">Fotos</NavLink>
              <NavLink href="/dashboard/photos/monthly-compare">Comparação Mensal</NavLink>

              {session?.user?.role === 'PROFESSOR' && (
                <NavLink href="/dashboard/students">Alunos</NavLink>
              )}

              {session?.user?.email === 'felipe.conhariki@gmail.com' && (
                <>
                  <NavLink href="/dashboard/measurement-types">Tipos de Medidas</NavLink>
                  <NavLink href="/dashboard/admin/register-professor">Registrar Professor</NavLink>
                </>
              )}
            </HStack>
          </HStack>
          <Flex alignItems={'center'} gap={4}>
            {session?.user?.role === 'PROFESSOR' && students.length > 0 && (
              <FormControl maxW="200px">
                <Select
                  value={selectedStudentId || ''}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value || null);
                    router.push('/dashboard');
                  }}
                  size="sm"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}
            <IconButton
              aria-label="Alternar tema"
              icon={isDarkMode ? <SunIcon /> : <MoonIcon />}
              onClick={toggleTheme}
              variant="ghost"
              size="lg"
              mr={2}
            />
            <Menu>
              <MenuButton
                as={Button}
                rounded={'full'}
                variant={'link'}
                cursor={'pointer'}
                minW={0}
              >
                <Avatar
                  size={'sm'}
                  name={session?.user?.name || 'Usuário'}
                />
              </MenuButton>
              <MenuList>
                <MenuItem as={Link} href="/dashboard/profile">Perfil</MenuItem>
                <MenuItem onClick={() => signOut()}>Sair</MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>

        {isOpen ? (
          <Box pb={4} display={{ md: 'none' }}>
            <Stack as={'nav'} spacing={4}>
              <NavLink href="/dashboard" onClick={onClose}>Dashboard</NavLink>
              <NavLink href="/dashboard/measurements" onClick={onClose}>Medições</NavLink>
              <NavLink href="/dashboard/photos" onClick={onClose}>Fotos</NavLink>
              <NavLink href="/dashboard/photos/monthly-compare" onClick={onClose}>Comparação Mensal</NavLink>

              {session?.user?.role === 'PROFESSOR' && (
                <NavLink href="/dashboard/students" onClick={onClose}>Alunos</NavLink>
              )}

              {session?.user?.email === 'felipe.conhariki@gmail.com' && (
                <>
                  <NavLink href="/dashboard/measurement-types" onClick={onClose}>Tipos de Medidas</NavLink>
                  <NavLink href="/dashboard/admin/register-professor" onClick={onClose}>Registrar Professor</NavLink>
                </>
              )}
            </Stack>
          </Box>
        ) : null}
      </Box>

      <Box p={4}>{children}</Box>
    </Box>
  );
} 