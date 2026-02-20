'use client';
import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
    config: {
        initialColorMode: 'dark',
        useSystemColorMode: false,
    },
    styles: {
        global: (props: any) => ({
            body: {
                bg: props.colorMode === 'dark' ? 'gray.900' : 'gray.50',
                color: props.colorMode === 'dark' ? 'white' : 'gray.800',
            },
        }),
    },
    components: {
        Button: {
            baseStyle: (props: any) => ({
                _hover: {
                    bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
                },
            }),
        },
        Card: {
            baseStyle: (props: any) => ({
                bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
            }),
        },
    },
});
