import { useEffect, useState } from 'react';
import {
  Box, Flex, Heading, Text, Spinner, VStack, HStack, Badge, Button, Icon,
} from '@chakra-ui/react';
import { Download } from 'lucide-react';

const API_BASE = '/api';

export default function StudentResults({ token }) {
  const [appliedJobs, setAppliedJobs] = useState([]);
  const [resultsByJobId, setResultsByJobId] = useState({});
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const normalizeFileUrl = (rawUrl) => {
    if (!rawUrl || !String(rawUrl).trim()) return '';
    const value = String(rawUrl).trim();
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return `${window.location.origin}${value.startsWith('/') ? value : `/${value}`}`;
  };

  const statusPalette = (status) => {
    if (status === 'Selected') return 'green';
    if (status === 'Rejected') return 'red';
    return 'blue';
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/jobs/my-applications`, { headers });
      if (!res.ok) {
        setAppliedJobs([]);
        setResultsByJobId({});
        return;
      }

      const data = await res.json();
      const jobs = data.jobs || [];
      setAppliedJobs(jobs);

      if (!jobs.length) {
        setResultsByJobId({});
        return;
      }

      const pairs = await Promise.all(
        jobs.map(async (job) => {
          try {
            const resultRes = await fetch(`${API_BASE}/results/${job.id}`, { headers });
            if (!resultRes.ok) return [job.id, []];
            const resultData = await resultRes.json();
            return [job.id, resultData.results || []];
          } catch {
            return [job.id, []];
          }
        }),
      );

      setResultsByJobId(Object.fromEntries(pairs));
    } catch {
      setAppliedJobs([]);
      setResultsByJobId({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  return (
    <Box>
      <Heading size="xl" color="gray.100" mb={1}>Results</Heading>
      <Text color="gray.400" fontSize="sm" mb={6}>
        Round-wise updates for jobs where you are interested or shortlisted.
      </Text>

      {loading ? (
        <Flex align="center" gap={2}>
          <Spinner size="sm" color="blue.300" />
          <Text color="gray.400" fontSize="sm">Loading your results...</Text>
        </Flex>
      ) : appliedJobs.length === 0 ? (
        <Text color="gray.500" fontSize="sm">No applied jobs yet.</Text>
      ) : (
        <VStack align="stretch" gap={3}>
          {appliedJobs.map((job) => {
            const rows = resultsByJobId[job.id] || [];
            return (
              <Box key={job.id} bg="gray.900" border="1px solid" borderColor="gray.800" borderRadius="xl" p={4}>
                <Flex justify="space-between" align="center" mb={2}>
                  <Box>
                    <Text color="gray.100" fontWeight="600">{job.title}</Text>
                    <Text color="blue.400" fontSize="sm">{job.company}</Text>
                  </Box>
                  <HStack gap={2}>
                    {job.is_shortlisted && <Badge colorPalette="purple" fontSize="xs">Shortlisted</Badge>}
                    {job.is_interested && <Badge colorPalette="blue" fontSize="xs">Interested</Badge>}
                  </HStack>
                </Flex>

                {rows.length === 0 ? (
                  <Text color="gray.500" fontSize="sm">No result updates yet for this job.</Text>
                ) : (
                  <VStack align="stretch" gap={2}>
                    {rows.map((row) => (
                      <Box key={row.id} bg="gray.950" border="1px solid" borderColor="gray.800" borderRadius="md" p={3}>
                        <Flex justify="space-between" align="center" mb={1}>
                          <Text color="gray.200" fontSize="sm" fontWeight="500">{row.round_name}</Text>
                          <Badge colorPalette={statusPalette(row.status)} fontSize="xs">{row.status || 'Qualified'}</Badge>
                        </Flex>
                        {row.remarks && <Text color="gray.400" fontSize="sm" mb={2}>{row.remarks}</Text>}
                        {row.file_url && (
                          <Button
                            size="xs"
                            variant="outline"
                            colorPalette="blue"
                            onClick={() => window.open(normalizeFileUrl(row.file_url), '_blank', 'noopener,noreferrer')}
                          >
                            <Icon asChild w={3} h={3} mr={1}><Download /></Icon>
                            Download
                          </Button>
                        )}
                      </Box>
                    ))}
                  </VStack>
                )}
              </Box>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}