import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, CheckCircle2, BookOpen, Briefcase } from 'lucide-react';
import axios from 'axios';
import { toaster } from '@/components/ui/toaster';
import RoadmapViewport from '../components/RoadmapViewport';

const MotionBox = motion(Box);

const ROLE_SUGGESTIONS = [
  'AI Engineer', 'AI Prompt Engineer', 'API Developer', 'AR/VR Developer',
  'Android Developer', 'Automation Test Engineer', 'Backend Developer',
  'Big Data Engineer', 'Bioinformatician', 'Blockchain Developer',
  'Business Intelligence Analyst', 'Cloud Architect', 'Cloud Engineer',
  'Computer Vision Engineer', 'Cybersecurity Analyst', 'Data Analyst',
  'Data Engineer', 'Data Scientist', 'Database Administrator',
  'DevOps Engineer', 'Embedded Systems Engineer', 'Frontend Developer',
  'Full Stack Developer', 'Game Developer', 'IT Manager',
  'Infrastructure Architect', 'Integration Engineer', 'IoT Developer',
  'Java Developer', 'Linux Administrator', 'MLOps Engineer',
  'Machine Learning Engineer', 'Mainframe Developer', 'Mobile Developer',
  'Network Engineer', 'NLP Engineer', 'Penetration Tester',
  'Platform Engineer', 'Python Developer', 'QA Engineer',
  'React Developer', 'Robotics Engineer', 'SRE Engineer',
  'Security Engineer', 'Solutions Architect', 'Software Engineer',
  'System Administrator', 'Technical Writer', 'UI/UX Designer',
  'UX Researcher', 'Web Developer', 'WordPress Developer', 'iOS Developer',
];

export default function SkillGapPage() {
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Roadmap state
  const [roadmapData, setRoadmapData] = useState(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [activeSkillForRoadmap, setActiveSkillForRoadmap] = useState(null);

  const filteredRoles = role.trim()
    ? ROLE_SUGGESTIONS.filter(r => r.toLowerCase().includes(role.toLowerCase())).slice(0, 8)
    : [];

  const selectRole = (r) => {
    setRole(r);
    setShowSuggestions(false);
  };

  const handleSearch = async () => {
    if (!role.trim()) return;
    setShowSuggestions(false);

    setIsLoading(true);
    try {
      const response = await axios.post('/api/predict-skills', { role });
      const predictedSkills = response.data.skills.map(s => ({
        name: s,
        isKnown: false
      }));
      setSkills(predictedSkills);
      setHasSearched(true);
      setRoadmapData(null);
    } catch (error) {
      toaster.create({
        title: 'Prediction Failed',
        description: error.response?.data?.detail || 'Something went wrong',
        type: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRoadmap = async (skillName) => {
    if (!skillName) return;

    setIsGeneratingRoadmap(true);
    setActiveSkillForRoadmap(skillName);

    try {
      const response = await axios.post('/api/generate-learning-path', { skill: skillName });
      setRoadmapData(response.data);
    } catch (error) {
      toaster.create({
        title: 'Roadmap Generation Failed',
        description: error.response?.data?.detail || 'Groq API error',
        type: 'error',
        duration: 3000,
      });
      setActiveSkillForRoadmap(null);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const toggleSkill = (skillName) => {
    setSkills(prev => prev.map(s =>
      s.name === skillName ? { ...s, isKnown: !s.isKnown } : s
    ));
  };

  const remainingSkills = skills.filter(s => !s.isKnown);

  if (roadmapData && activeSkillForRoadmap) {
    return (
      <RoadmapViewport
        data={roadmapData}
        skillName={activeSkillForRoadmap}
        onBack={() => setRoadmapData(null)}
      />
    );
  }

  return (
    <Box color="white" fontFamily="'Inter', sans-serif">
      <Container maxW="5xl">
        <VStack gap={6} align="stretch">
          {/* Header Section */}
          <VStack gap={3} textAlign="center">
            <MotionBox
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Heading size="2xl" fontWeight="900" letterSpacing="tight" mb={2}>
                AI <Text as="span" color="blue.400">Skill Gap</Text> Analyzer
              </Heading>
              <Text color="gray.400" fontSize="md" maxW="2xl">
                Enter your target role. Click skills you know to reveal your gap.
              </Text>
            </MotionBox>

            {/* Input Bar with Suggestions */}
            <Box position="relative" w="full" maxW="2xl">
              <Flex
                bg="gray.900"
                p={2}
                borderRadius="2xl"
                border="1px solid"
                borderColor="gray.800"
                gap={4}
                boxShadow="0 10px 30px rgba(0,0,0,0.5)"
                align="center"
              >
                <Flex flex={1} px={4} align="center" gap={2}>
                  <Icon asChild w={5} h={5} color="gray.500"><Search /></Icon>
                  <Input
                    variant="flushed"
                    placeholder="e.g. Full Stack Developer"
                    value={role}
                    onChange={(e) => { setRole(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => { if (role.trim()) setShowSuggestions(true); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    borderBottom="none"
                    color="white"
                    _placeholder={{ color: 'gray.600' }}
                  />
                </Flex>
                <Button
                  colorPalette="blue"
                  size="lg"
                  px={8}
                  borderRadius="xl"
                  loading={isLoading}
                  onClick={handleSearch}
                >
                  <Icon asChild w={4} h={4}><Sparkles /></Icon>
                  Analyze
                </Button>
              </Flex>

              {/* Suggestion Dropdown */}
              {showSuggestions && filteredRoles.length > 0 && (
                <Box
                  position="absolute"
                  top="100%"
                  left={0}
                  right={0}
                  mt={1}
                  bg="rgba(15, 23, 42, 0.95)"
                  backdropFilter="blur(16px)"
                  border="1px solid"
                  borderColor="gray.700"
                  borderRadius="xl"
                  zIndex={10}
                  overflow="hidden"
                  boxShadow="0 15px 40px rgba(0,0,0,0.6)"
                  py={1}
                >
                  <Text px={4} py={2} fontSize="2xs" color="gray.500" fontWeight="600" letterSpacing="wider" textTransform="uppercase">
                    Suggestions
                  </Text>
                  {filteredRoles.map((r) => (
                    <Flex
                      key={r}
                      px={4}
                      py={2}
                      mx={2}
                      cursor="pointer"
                      align="center"
                      gap={3}
                      borderRadius="lg"
                      _hover={{ bg: 'whiteAlpha.100' }}
                      onClick={() => selectRole(r)}
                      transition="all 0.15s"
                    >
                      <Flex
                        w={7} h={7}
                        align="center" justify="center"
                        borderRadius="md"
                        bg="blue.500/15"
                      >
                        <Icon asChild w={3.5} h={3.5} color="blue.400"><Briefcase /></Icon>
                      </Flex>
                      <Text fontSize="sm" color="gray.200" fontWeight="500">{r}</Text>
                    </Flex>
                  ))}
                </Box>
              )}
            </Box>
          </VStack>

          {/* Skill Bubbles Section */}
          {hasSearched && (
            <VStack gap={5} align="stretch">
              <Flex justify="space-between" align="center">
                <Heading size="md" color="gray.100">Predicted Core Tech Skills</Heading>
                <Text color="blue.400" fontWeight="bold" fontSize="sm">
                  {remainingSkills.length} Remaining
                </Text>
              </Flex>

              <Box
                p={6}
                bg="gray.900"
                borderRadius="2xl"
                border="1px solid"
                borderColor="gray.800"
                minH="200px"
                position="relative"
                overflow="hidden"
              >
                <SimpleGrid columns={{ base: 2, md: 3, lg: 4, xl: 5 }} gap={3}>

                  <AnimatePresence mode="popLayout">
                    {skills.map((skill) => (
                      !skill.isKnown && (
                        <MotionBox
                          key={skill.name}
                          layout
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 1.5, opacity: 0, filter: 'blur(20px)' }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleSkill(skill.name)}
                          cursor="pointer"
                        >
                          <Box
                            bg="blue.900/40"
                            px={3}
                            py={1.5}
                            borderRadius="lg"
                            textAlign="center"
                            boxShadow="0 0 10px rgba(59,130,246,0.15)"
                            border="1px solid"
                            borderColor="blue.400/50"
                          >
                            <Text fontWeight="600" fontSize="xs">{skill.name}</Text>
                          </Box>
                        </MotionBox>
                      )
                    ))}
                  </AnimatePresence>
                </SimpleGrid>

                {remainingSkills.length === 0 && skills.length > 0 && (
                  <MotionBox
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    textAlign="center"
                    py={20}
                  >
                    <Icon asChild w={16} h={16} color="green.400" mb={4}><CheckCircle2 /></Icon>
                    <Heading size="xl" color="white">You're All Set!</Heading>
                    <Text color="gray.400" mt={2}>You've mastered all the core skills for this role.</Text>
                  </MotionBox>
                )}
              </Box>

              {/* Roadmap buttons for remaining skills */}
              {remainingSkills.length > 0 && (
                <VStack gap={6} align="center" pt={8}>
                  <Text color="gray.500">Select a skill to dive deeper into its learning path</Text>

                  <Flex gap={4} wrap="wrap" justify="center">
                    {remainingSkills.map(skill => (
                      <Button
                        key={skill.name}
                        variant="outline"
                        borderColor="blue.400"
                        color="blue.400"
                        _hover={{ bg: 'blue.400', color: 'white' }}
                        size="sm"
                        borderRadius="full"
                        loading={isGeneratingRoadmap && activeSkillForRoadmap === skill.name}
                        onClick={() => generateRoadmap(skill.name)}
                      >
                        <Icon asChild h={4} w={4}><BookOpen /></Icon>
                        Roadmap for {skill.name}
                      </Button>
                    ))}
                  </Flex>
                </VStack>
              )}
            </VStack>
          )}
        </VStack>
      </Container>
    </Box>
  );
}
