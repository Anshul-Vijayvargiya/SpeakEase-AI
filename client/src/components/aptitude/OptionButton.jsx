import React from 'react';

const STATE = {
  default:  { bg: '#1a1d2e', border: '#334155', text: '#94a3b8' },
  selected: { bg: '#1e3a5f', border: '#3b82f6', text: '#93c5fd' },
  correct:  { bg: '#052e16', border: '#22c55e', text: '#86efac', icon: '✅' },
  wrong:    { bg: '#2d0a0a', border: '#ef4444', text: '#fca5a5', icon: '❌' },
};

const OptionButton = ({ label, text, isSelected, isCorrect, isWrong, isDisabled, onClick }) => {
  let state = STATE.default;
  if (isCorrect && isDisabled) state = STATE.correct;
  else if (isWrong  && isDisabled) state = STATE.wrong;
  else if (isSelected && !isDisabled) state = STATE.selected;

  return (
    <button
      onClick={!isDisabled ? onClick : undefined}
      style={{
        width:         '100%',
        padding:       '14px 18px',
        marginBottom:  10,
        background:    state.bg,
        border:        `2px solid ${state.border}`,
        borderRadius:  14,
        color:         state.text,
        textAlign:     'left',
        cursor:        isDisabled ? 'not-allowed' : 'pointer',
        display:       'flex',
        alignItems:    'center',
        gap:           14,
        fontSize:      15,
        fontWeight:    600,
        transition:    'all 0.18s ease',
        opacity:       isDisabled && !isCorrect && !isWrong && !isSelected ? 0.55 : 1,
      }}
    >
      <span style={{
        minWidth:       34,
        height:         34,
        borderRadius:   '50%',
        background:     state.border,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontWeight:     800,
        fontSize:       13,
        color:          '#fff',
        flexShrink:     0,
      }}>
        {(isCorrect || isWrong) && isDisabled ? state.icon : label}
      </span>
      <span style={{ lineHeight: 1.5 }}>{text}</span>
    </button>
  );
};

export default OptionButton;
