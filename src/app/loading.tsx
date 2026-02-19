import { Center, Spinner, Text, VStack } from '@chakra-ui/react';

export default function Loading() {
    return (
        <Center h="100vh" w="100vw" bg="gray.50" _dark={{ bg: 'gray.900' }}>
            <VStack spacing={4}>
                <Spinner
                    thickness="4px"
                    speed="0.65s"
                    emptyColor="gray.200"
                    color="blue.500"
                    size="xl"
                />
                <Text color="gray.500" fontSize="lg" fontWeight="medium">
                    Carregando...
                </Text>
            </VStack>
        </Center>
    );
}
