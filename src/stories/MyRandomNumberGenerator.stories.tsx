import { MyRandomNumberGenerator } from './MyRandomNumberGenerator';
import { useEffect, useState } from 'react';

export const Demo = () => {
  const [attempts, setAttempts] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setAttempts(attempts + 1);
    }, 2000);

    return () => clearInterval(interval);
  });


  return (
    <div>
      <MyRandomNumberGenerator
        maximumGenerationAttempts={attempts}
        range={{ from: 1, to: 100 }}
      />
    </div>
  );
};

export const SimplestCounterTimer = () => (
  <div>
    <MyRandomNumberGenerator.SomeObservableComponentWithAIntervalTimer />
  </div>
);
