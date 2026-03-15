import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  isLoading = false,
}) {
  if (!isOpen) return null;

  return (
    <>
      <Box
        position="fixed"
        inset="0"
        bg="blackAlpha.700"
        backdropFilter="blur(4px)"
        display="flex"
        alignItems="center"
        justifyContent="center"
        zIndex={1600}
        animation="confirmationFadeIn 0.18s ease-out"
      >
        <Box
          bg="gray.900"
          border="1px solid"
          borderColor="gray.800"
          borderRadius="16px"
          boxShadow="0 20px 45px rgba(0, 0, 0, 0.35)"
          p={6}
          w="full"
          maxW="420px"
          mx={4}
          animation="confirmationCardIn 0.22s ease-out"
        >
          <Heading size="md" color="white">{title}</Heading>
          <Text color="gray.400" fontSize="sm" mt={2}>{message}</Text>

          <Flex justify="flex-end" gap={3} mt={6}>
            <Button
              bg="gray.800"
              _hover={{ bg: 'gray.700' }}
              color="white"
              px={4}
              py={2}
              borderRadius="lg"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              bg="purple.500"
              _hover={{ bg: 'purple.600' }}
              color="white"
              px={4}
              py={2}
              borderRadius="lg"
              onClick={onConfirm}
              loading={isLoading}
              loadingText={confirmLabel}
            >
              {confirmLabel}
            </Button>
          </Flex>
        </Box>
      </Box>

      <style>{`
        @keyframes confirmationFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes confirmationCardIn {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
}
