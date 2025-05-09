import {
  Box,
  Select,
  Stack,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Measurement {
  _id: string;
  date: string;
  weight: number;
  height: number;
  measurements: {
    arm?: number;
    chest?: number;
    waist?: number;
    hip?: number;
    thigh?: number;
    calf?: number;
  };
}

const MEASUREMENT_TYPES = [
  { value: 'weight', label: 'Weight' },
  { value: 'arm', label: 'Arm' },
  { value: 'chest', label: 'Chest' },
  { value: 'waist', label: 'Waist' },
  { value: 'hip', label: 'Hip' },
  { value: 'thigh', label: 'Thigh' },
  { value: 'calf', label: 'Calf' },
];

export default function ProgressChart() {
  const [selectedType, setSelectedType] = useState('weight');
  const bgColor = useColorModeValue('white', 'gray.800');

  const { data: measurements, isLoading } = useQuery<Measurement[]>(
    'measurements',
    async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/measurements/my-measurements`);
      return response.data;
    }
  );

  const formatData = (measurements: Measurement[] | undefined) => {
    if (!measurements) return [];

    return measurements.map((measurement) => ({
      date: new Date(measurement.date).toLocaleDateString(),
      value: selectedType === 'weight'
        ? measurement.weight
        : measurement.measurements[selectedType as keyof typeof measurement.measurements] || 0,
    }));
  };

  const getYAxisLabel = () => {
    if (selectedType === 'weight') return 'Weight (kg)';
    return 'Circumference (cm)';
  };

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Stack spacing={4}>
      <Select
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        maxW="200px"
      >
        {MEASUREMENT_TYPES.map((type) => (
          <option key={type.value} value={type.value}>
            {type.label}
          </option>
        ))}
      </Select>

      <Box
        bg={bgColor}
        p={4}
        borderRadius="md"
        height="400px"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={formatData(measurements)}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: getYAxisLabel(), angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0ea5e9"
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Stack>
  );
} 