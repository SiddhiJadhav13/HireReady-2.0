import React, { useState, useEffect } from 'react';
import {
  Box, Flex, Heading, Text, Button, VStack, HStack, Spinner, Badge, Icon,
} from '@chakra-ui/react';
import { ProgressBar, ProgressRoot } from '@/components/ui/progress';
import { Code, FileQuestion, X, ArrowRight, Check, ChevronLeft } from 'lucide-react';

const API_BASE_URL = '/api';

const QuizRunner = ({ role, difficulty, initialResultId, onComplete, onCancel, viewOnly = false, sessionQuestions = null, sessionAnswers = null }) => {
  const [questions, setQuestions] = useState(sessionQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(sessionAnswers || {});
  const [visited, setVisited] = useState(new Set([0]));
  const [markedForReview, setMarkedForReview] = useState(new Set());
  
  const [loading, setLoading] = useState(!sessionQuestions);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(viewOnly);
  const [score, setScore] = useState(0);
  const [resultId, setResultId] = useState(initialResultId || null);
  const [showBreakdown, setShowBreakdown] = useState(viewOnly && !!sessionQuestions);

  useEffect(() => {
    if (sessionQuestions && sessionAnswers) {
      setLoading(false);
      computeScore(sessionQuestions, sessionAnswers);
      return;
    }

    const fetchQuestions = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/quiz/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ role, difficulty, resultId: initialResultId }),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || 'Failed to generate quiz');
        }
        const data = await res.json();
        const fetchedQuestions = data.questions || [];
        setQuestions(fetchedQuestions);
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(err.message);
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [role, difficulty, initialResultId, viewOnly, sessionQuestions, sessionAnswers]);

  const computeScore = (qs, ans) => {
    let correct = 0;
    qs.forEach((q, i) => {
      if ((ans[i] || '') === q.correctAnswer) correct++;
    });
    setScore(correct);
  };

  const handleSelectAnswer = (opt) => {
    if (viewOnly) return;
    setAnswers(prev => ({ ...prev, [currentIndex]: opt }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setVisited(prev => new Set(prev).add(nextIndex));
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setVisited(prev => new Set(prev).add(prevIndex));
    }
  };

  const handleJumpToQuestion = (index) => {
    setCurrentIndex(index);
    setVisited(prev => new Set(prev).add(index));
  };

  const toggleReview = () => {
    if (viewOnly) return;
    setMarkedForReview(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentIndex)) newSet.delete(currentIndex);
      else newSet.add(currentIndex);
      return newSet;
    });
  };

  const handleSubmit = async () => {
    let correct = 0;
    const answerPayload = questions.map((q, i) => {
      const userAnswer = answers[i] || '';
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) correct++;
      return { questionIndex: i, userAnswer, isCorrect };
    });
    setScore(correct);
    setSubmitted(true);
    setShowBreakdown(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          role, difficulty, score: correct, totalQuestions: questions.length,
          questions: [], // Marks only in DB
          answers: [],    // Marks only in DB
          resultId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResultId(data.resultId);
      }
    } catch (err) { console.error('Failed to submit', err); }
  };

  const handleFinalComplete = () => {
    if (onComplete) {
      onComplete({
        resultId,
        questions,
        answers,
        score,
        total: questions.length
      });
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <Flex direction="column" align="center" justify="center" h="400px" gap={4}>
        <Spinner size="xl" color="blue.400" />
        <Text color="gray.300" fontWeight="500">{viewOnly ? 'Loading Results...' : `Generating ${role} quiz (${difficulty})...`}</Text>
        {!viewOnly && <Text color="gray.500" fontSize="sm">This relies on AI and might take 10-20 seconds.</Text>}
      </Flex>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <Flex direction="column" align="center" justify="center" h="300px" gap={4}>
        <Box bg="red.500/15" border="1px solid" borderColor="red.500/30" borderRadius="lg" px={6} py={4}>
          <Text color="red.300">{error}</Text>
        </Box>
        <Button variant="outline" borderColor="gray.700" color="gray.300" onClick={onCancel}>
          <Icon asChild w={4} h={4}><ChevronLeft /></Icon> Back to Selection
        </Button>
      </Flex>
    );
  }

  /* ── Submitted/Breakdown ── */
  if (submitted && showBreakdown) {
    const pct = Math.round((score / questions.length) * 100);
    let badgeColor = 'red';
    let message = 'Needs Practice';
    if (pct >= 80) { badgeColor = 'green'; message = 'Excellent!'; }
    else if (pct >= 50) { badgeColor = 'yellow'; message = 'Good Job'; }

    return (
      <Box maxW="900px" mx="auto" w="full">
        <Flex justify="space-between" align="center" mb={6}>
          <VStack align="flex-start" gap={1}>
            <Heading size="lg" color="gray.100">{viewOnly ? 'Quiz Review' : 'Quiz Results'}</Heading>
            <Text color="gray.400">{role} • {difficulty}</Text>
          </VStack>
          <HStack gap={4}>
            <Box textAlign="right">
              <Text fontSize="2xl" fontWeight="800" color={`${badgeColor}.400`} display="inline">
                {score}
              </Text>
              <Text color="gray.400" fontSize="md" display="inline"> / {questions.length}</Text>
              <Text fontSize="xs" color="gray.500">{message} ({pct}%)</Text>
            </Box>
            <Button colorPalette="blue" size="sm" onClick={handleFinalComplete}>Close Review</Button>
          </HStack>
        </Flex>

        <VStack gap={4} align="stretch" mb={8}>
          {questions.map((q, i) => {
            const userAnswer = answers[i] || '';
            const isCorrect = userAnswer === q.correctAnswer;
            const statusColor = isCorrect ? 'green.500' : 'red.500';

            return (
              <Box 
                key={i} 
                bg="gray.900" 
                border="1px solid" 
                borderColor={isCorrect ? 'green.800/50' : 'red.800/50'} 
                borderRadius="xl" 
                p={5}
              >
                <Flex justify="space-between" mb={3}>
                  <HStack>
                     <Badge colorPalette={statusColor.split('.')[0]} variant="solid">Q{i + 1}</Badge>
                     <Text color="gray.300" fontSize="sm" fontWeight="bold">
                        {isCorrect ? 'Correct' : 'Incorrect'}
                     </Text>
                  </HStack>
                  {q.type === 'snippet' && <Badge colorPalette="teal" variant="outline" size="xs">Snippet</Badge>}
                </Flex>

                <Text color="gray.100" mb={4} fontWeight="500">{q.question.split('```')[0]}</Text>
                
                {q.type === 'snippet' && (
                  <Box bg="gray.950" border="1px solid" borderColor="gray.800" borderRadius="md" p={3} mb={4} fontFamily="mono" fontSize="xs" color="green.300">
                    <pre>{q.question.split('```')[1] || ''}</pre>
                  </Box>
                )}

                <VStack align="stretch" gap={2}>
                  {q.options.map((opt) => {
                    const isSelected = userAnswer === opt;
                    const isRight = q.correctAnswer === opt;
                    
                    let bgColor = 'transparent';
                    let borderColor = 'gray.700';
                    let textColor = 'gray.400';
                    let icon = null;

                    if (isRight) {
                        bgColor = 'green.500/10';
                        borderColor = 'green.500';
                        textColor = 'green.200';
                        icon = <Icon asChild color="green.400" w={4} h={4}><Check /></Icon>;
                    } else if (isSelected && !isCorrect) {
                        bgColor = 'red.500/10';
                        borderColor = 'red.500';
                        textColor = 'red.200';
                        icon = <Icon asChild color="red.400" w={4} h={4}><X /></Icon>;
                    }

                    return (
                      <HStack 
                        key={opt} 
                        px={4} py={2} 
                        borderRadius="md" 
                        border="1px solid" 
                        borderColor={borderColor}
                        bg={bgColor}
                        justify="space-between"
                      >
                        <Text fontSize="sm" color={textColor}>{opt}</Text>
                        {icon}
                      </HStack>
                    );
                  })}
                </VStack>
              </Box>
            );
          })}
        </VStack>
        
        <Flex justify="center" pb={10}>
             <Button size="lg" colorPalette="blue" onClick={handleFinalComplete}>Back to Dashboard</Button>
        </Flex>
      </Box>
    );
  }

  /* ── Submitted (Old Summary - Hidden by showBreakdown) ── */
  if (submitted) {
    setShowBreakdown(true);
    return null;
  }

  /* ── Active quiz ── */
  const question = questions[currentIndex];
  const selectedOption = answers[currentIndex] || '';

  // Helpers for sidebar colors
  const getButtonStateColor = (idx) => {
    const isAnswered = !!answers[idx];
    const isMarked = markedForReview.has(idx);
    const isVisited = visited.has(idx);
    const isActive = idx === currentIndex;

    let bg = 'gray.800';
    let border = '1px solid var(--chakra-colors-gray-700)';
    let color = 'gray.400';

    if (isMarked) {
      bg = 'purple.600';
      color = 'white';
      border = '1px solid var(--chakra-colors-purple-500)';
    } else if (isAnswered) {
      bg = 'green.500';
      color = 'white';
      border = '1px solid var(--chakra-colors-green-400)';
    } else if (isVisited) {
      bg = 'red.500';
      color = 'white';
      border = '1px solid var(--chakra-colors-red-400)';
    }

    if (isActive) {
      border = '2px solid white';
    }

    return { bg, color, border, isAnswered, isMarked };
  };

  return (
    <Box maxW="1200px" mx="auto" w="full">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={6}>
        <HStack gap={3}>
          <Heading size="md" color="gray.100">Quiz Runner</Heading>
          <Badge colorPalette="blue" px={2} py={1} borderRadius="md">{role}</Badge>
          <Badge colorPalette="purple" px={2} py={1} borderRadius="md">{difficulty}</Badge>
        </HStack>
        <Button size="sm" variant="ghost" color="gray.400" _hover={{ color: 'red.300' }} onClick={onCancel}>
          <Icon asChild w={4} h={4}><X /></Icon> Cancel
        </Button>
      </Flex>

      <Flex gap={8} direction={{ base: 'column', lg: 'row' }} align="flex-start">
        
        {/* Left Pane: Question Area */}
        <Box flex={1} w="full">
          <Box bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="xl" p={6} boxShadow="xl">
            <Flex justify="space-between" align="center" mb={4}>
              <Text color="blue.400" fontWeight="bold" fontSize="md">Question {currentIndex + 1}</Text>
              <Badge colorPalette={question.type === 'snippet' ? 'teal' : 'blue'} fontSize="xs" px={2} py={1} borderRadius="full">
                {question.type === 'snippet'
                  ? <><Icon asChild w={3} h={3} mr={1}><Code /></Icon>Code Snippet</>
                  : <><Icon asChild w={3} h={3} mr={1}><FileQuestion /></Icon>Multiple Choice</>}
              </Badge>
            </Flex>

            {/* Question Text */}
            <Box mb={5}>
              {question.type === 'snippet' ? (
                <>
                  <Text color="gray.100" fontSize="md" mb={2}>{question.question.split('```')[0]}</Text>
                  <Box bg="gray.950" border="1px solid" borderColor="gray.800" borderRadius="md" p={4} fontFamily="mono" fontSize="sm" color="green.300" overflowX="auto">
                    <pre>{question.question.split('```')[1] || question.question}</pre>
                  </Box>
                </>
              ) : (
                <Heading size="sm" color="gray.100" fontWeight="500" lineHeight="1.5">
                  {question.question}
                </Heading>
              )}
            </Box>

            {/* Options */}
            <VStack gap={3} align="stretch" mb={6}>
              {question.options.map((opt) => (
                <Button
                  key={opt}
                  variant="outline"
                  w="full"
                  justifyContent="flex-start"
                  textAlign="left"
                  whiteSpace="normal"
                  h="auto"
                  py={3}
                  px={4}
                  fontSize="sm"
                  borderColor={selectedOption === opt ? 'blue.500' : 'gray.700'}
                  bg={selectedOption === opt ? 'blue.500/15' : 'gray.800/40'}
                  color={selectedOption === opt ? 'white' : 'gray.300'}
                  _hover={{ borderColor: selectedOption === opt ? 'blue.400' : 'gray.500', bg: selectedOption === opt ? 'blue.500/20' : 'gray.800' }}
                  onClick={() => handleSelectAnswer(opt)}
                >
                  <Box as="span" mr={3} w={5} h={5} borderRadius="full" border="2px solid" 
                    borderColor={selectedOption === opt ? 'blue.400' : 'gray.600'} 
                    bg={selectedOption === opt ? 'blue.500' : 'transparent'}
                    display="inline-flex" alignItems="center" justifyContent="center" flexShrink={0}
                  >
                    {selectedOption === opt && <Box w={2} h={2} bg="white" borderRadius="full" />}
                  </Box>
                  {opt}
                </Button>
              ))}
            </VStack>

            {/* Navigation Bar */}
            <Flex justify="space-between" align="center" pt={4} borderTop="1px solid" borderColor="gray.800">
              <Button size="sm" variant="outline" borderColor="gray.700" color="gray.300" onClick={handlePrev} disabled={currentIndex === 0}>
                <Icon asChild w={4} h={4} mr={2}><ChevronLeft /></Icon> Previous
              </Button>
              
              <Button 
                size="sm"
                variant={markedForReview.has(currentIndex) ? 'solid' : 'outline'} 
                colorPalette="purple" 
                borderColor={markedForReview.has(currentIndex) ? 'transparent' : 'purple.500/50'}
                onClick={toggleReview}
                disabled={viewOnly}
              >
                Mark for Review
              </Button>

              <Button size="sm" colorPalette="blue" onClick={handleNext} disabled={currentIndex === questions.length - 1}>
                Next <Icon asChild w={4} h={4} ml={2}><ArrowRight /></Icon>
              </Button>
            </Flex>
          </Box>
        </Box>

        {/* Right Sidebar: Grid & Submit */}
        <Box w={{ base: 'full', lg: '320px' }} bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="xl" p={6} boxShadow="xl" flexShrink={0}>
          <Text fontWeight="bold" color="gray.200" mb={4} fontSize="lg">Question Navigator</Text>
          
          <Flex wrap="wrap" gap={3} mb={6}>
            {questions.map((_, idx) => {
              const state = getButtonStateColor(idx);
              return (
                <Flex 
                  key={idx}
                  as="button"
                  onClick={() => handleJumpToQuestion(idx)}
                  w="42px" h="42px" 
                  borderRadius="full"
                  bg={state.bg}
                  color={state.color}
                  border={state.border}
                  align="center" justify="center"
                  fontWeight="bold"
                  fontSize="sm"
                  position="relative"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ transform: 'scale(1.05)' }}
                >
                  {idx + 1}
                  {/* Green dot for answered AND marked for review */}
                  {state.isMarked && state.isAnswered && (
                    <Box position="absolute" bottom="2px" right="2px" w={2.5} h={2.5} bg="green.400" borderRadius="full" border="1px solid var(--chakra-colors-gray-900)" />
                  )}
                </Flex>
              );
            })}
          </Flex>

          {/* Legend */}
          <Box mb={6} borderTop="1px solid" borderBottom="1px solid" borderColor="gray.800" py={4}>
            <VStack align="stretch" gap={3}>
              <HStack><Box w={3} h={3} borderRadius="full" bg="green.500" /><Text fontSize="xs" color="gray.400" fontWeight="500">Answered</Text></HStack>
              <HStack><Box w={3} h={3} borderRadius="full" bg="red.500" /><Text fontSize="xs" color="gray.400" fontWeight="500">Not Answered</Text></HStack>
              <HStack><Box w={3} h={3} borderRadius="full" bg="purple.600" /><Text fontSize="xs" color="gray.400" fontWeight="500">Marked for Review</Text></HStack>
              <HStack>
                <Box position="relative" w={3} h={3}>
                  <Box w={3} h={3} borderRadius="full" bg="purple.600" />
                  <Box position="absolute" bottom="-2px" right="-2px" w={1.5} h={1.5} bg="green.400" borderRadius="full" border="1px solid var(--chakra-colors-gray-900)" />
                </Box>
                <Text fontSize="xs" color="gray.400" fontWeight="500">Answered & Marked</Text>
              </HStack>
              <HStack><Box w={3} h={3} borderRadius="full" bg="gray.800" border="1px solid var(--chakra-colors-gray-700)" /><Text fontSize="xs" color="gray.400" fontWeight="500">Not Visited</Text></HStack>
            </VStack>
          </Box>

          <Button 
            colorPalette={viewOnly ? "blue" : "green"} 
            size="lg" w="full" 
            onClick={viewOnly ? () => setShowBreakdown(true) : handleSubmit} 
            fontSize="md" fontWeight="bold"
          >
            {viewOnly ? "VIEW RESULTS" : "SUBMIT QUIZ"}
          </Button>
        </Box>

      </Flex>
    </Box>
  );
};


export default QuizRunner;
