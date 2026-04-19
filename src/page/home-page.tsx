import { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';

export function HomePage() {
  const [counter, setCounter] = useState(0);
  const { exit } = useApp();

  useInput((input, key) => {
    if (input === 'q') {
      exit();
    }
    if (key.upArrow) {
      setCounter((prev) => prev + 1);
    }
    if (key.downArrow) {
      setCounter((prev) => Math.max(0, prev - 1));
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCounter((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
        <Text bold color="cyan">
          Infer Scan - Interactive Dashboard
        </Text>
        <Text dimColor>Press ↑↓ to adjust counter, q to quit</Text>
      </Box>

      <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="green" padding={1}>
        <Text color="green">Counter: {counter}</Text>
        <Text dimColor>Auto-incrementing every second</Text>
      </Box>

      <Box marginTop={1} flexDirection="column" borderStyle="round" borderColor="yellow" padding={1}>
        <Text color="yellow">Status: Running</Text>
        <Text dimColor>Use arrow keys to interact</Text>
      </Box>
    </Box>
  );
}
