import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useToast,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

interface MeasurementData {
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

export default function MeasurementForm() {
  const [measurements, setMeasurements] = useState<MeasurementData>({
    weight: 0,
    height: 0,
    measurements: {},
  });
  const toast = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation(
    (data: MeasurementData) =>
      axios.post(`${process.env.NEXT_PUBLIC_API_URL}/measurements`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('measurements');
        toast({
          title: 'Success',
          description: 'Measurements saved successfully',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        setMeasurements({
          weight: 0,
          height: 0,
          measurements: {},
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.response?.data?.message || 'Failed to save measurements',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      },
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(measurements);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'weight' || name === 'height') {
      setMeasurements((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setMeasurements((prev) => ({
        ...prev,
        measurements: {
          ...prev.measurements,
          [name]: parseFloat(value) || 0,
        },
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>Weight (kg)</FormLabel>
          <Input
            type="number"
            name="weight"
            value={measurements.weight || ''}
            onChange={handleChange}
            step="0.1"
            required
          />
        </FormControl>

        <FormControl>
          <FormLabel>Height (cm)</FormLabel>
          <Input
            type="number"
            name="height"
            value={measurements.height || ''}
            onChange={handleChange}
            step="0.1"
            required
          />
        </FormControl>

        <FormControl>
          <FormLabel>Arm Circumference (cm)</FormLabel>
          <Input
            type="number"
            name="arm"
            value={measurements.measurements.arm || ''}
            onChange={handleChange}
            step="0.1"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Chest Circumference (cm)</FormLabel>
          <Input
            type="number"
            name="chest"
            value={measurements.measurements.chest || ''}
            onChange={handleChange}
            step="0.1"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Waist Circumference (cm)</FormLabel>
          <Input
            type="number"
            name="waist"
            value={measurements.measurements.waist || ''}
            onChange={handleChange}
            step="0.1"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Hip Circumference (cm)</FormLabel>
          <Input
            type="number"
            name="hip"
            value={measurements.measurements.hip || ''}
            onChange={handleChange}
            step="0.1"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Thigh Circumference (cm)</FormLabel>
          <Input
            type="number"
            name="thigh"
            value={measurements.measurements.thigh || ''}
            onChange={handleChange}
            step="0.1"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Calf Circumference (cm)</FormLabel>
          <Input
            type="number"
            name="calf"
            value={measurements.measurements.calf || ''}
            onChange={handleChange}
            step="0.1"
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="brand"
          isLoading={mutation.isLoading}
          loadingText="Saving..."
        >
          Save Measurements
        </Button>
      </Stack>
    </form>
  );
} 