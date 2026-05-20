import { useEffect, useState } from 'react';
import '../style/Title.css'

import { getStreak, isStreakFreezed } from '../globals';

interface PropsTitle {
  streakTitle: number;
}

export default function Title({streakTitle} : PropsTitle) {
  const [streakNum, setStreakNum] = useState<number>(getStreak());
  const [isFreezed, setIsFreezed] = useState<boolean>(false);

  useEffect(() => {
    setStreakNum(streakTitle);
    const checkFreezeStatus = async () => {
      const freezed = await isStreakFreezed();
      setIsFreezed(freezed);
    };
    checkFreezeStatus();
  }, [streakTitle]);


  return (
    <div className="title-streak-container">
      <h1 className='title' translate="no" title="TürKingo">TürKingo</h1>
      <p id="streak">
        <span
        className={`fire-icon ${isFreezed ? 'fire-freezed' : ''}`}
        >🔥</span> <span id="streak-num">{streakNum}</span>
      </p>
    </div>
  );
}
