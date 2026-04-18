import React from 'react';
import styles from './PredictionSlider.module.css';

export default function PredictionSlider({ value, onChange }) {
  return (
    <div className={styles.sliderHUD}>
      <div className={styles.statusBlock}>
        <div className={styles.dot}></div>
        <div className={styles.label}>LIVE</div>
      </div>
      
      <div className={styles.trackWrapper}>
        <input 
          type="range" 
          min="0" 
          max="72" 
          value={value} 
          onChange={(e) => onChange(Number(e.target.value))}
          className={styles.slider}
        />
        <div className={styles.values}>
          <span>NOW</span>
          <span>+24H</span>
          <span>+48H</span>
          <span>+72H</span>
        </div>
      </div>

      <div className={styles.timeDisplay}>
        {value === 0 ? 'REAL-TIME FEED' : `PROJECTED: +${value} HOURS`}
      </div>
    </div>
  );
}
