import React from "react";

export function SchoolCrest({ inverted = false }: { inverted?: boolean }) {
  const bg = inverted ? "#FFFFFF" : "#07187C";
  const fg = inverted ? "#07187C" : "#FFFFFF";

  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M20 3L5 9.5V19.5C5 28.8 11.4 35.6 20 38C28.6 35.6 35 28.8 35 19.5V9.5L20 3Z"
        fill={bg}
      />
      <path
        d="M20 6.5L8.2 11.6V19.4C8.2 26.8 13.3 32.4 20 34.5C26.7 32.4 31.8 26.8 31.8 19.4V11.6L20 6.5Z"
        stroke={fg}
        strokeWidth="1.5"
      />
      <path d="M13 18.5L20 14.5L27 18.5L20 22.5L13 18.5Z" fill={fg} />
      <path
        d="M15.5 21.2V25.5C15.5 26.4 17.5 27.5 20 27.5C22.5 27.5 24.5 26.4 24.5 25.5V21.2L20 23.8L15.5 21.2Z"
        fill={fg}
        fillOpacity="0.92"
      />
    </svg>
  );
}

export function StatIcon({ name }: { name: string }) {
  switch (name) {
    case "graduation":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3L2 8.5L12 14L22 8.5L12 3Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M6 11V16.5C6 18.2 8.7 19.5 12 19.5C15.3 19.5 18 18.2 18 16.5V11"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "ratio":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 4.5C9.51472 4.5 7.5 6.51472 7.5 9C7.5 11.4853 9.51472 13.5 12 13.5C14.4853 13.5 16.5 11.4853 16.5 9C16.5 6.51472 14.4853 4.5 12 4.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M4.5 20C5.3 16.8 8.3 15 12 15C15.7 15 18.7 16.8 19.5 20"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "staff":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 9H16M8 13H13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case "clubs":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L14.9 8.2L21.5 9L16.6 13.6L17.9 20.2L12 17L6.1 20.2L7.4 13.6L2.5 9L9.1 8.2L12 2Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "library":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M4 19.5V5.5C4 4.4 4.9 3.5 6 3.5H19.5V17.5H6C4.9 17.5 4 18.4 4 19.5ZM4 19.5C4 20.6 4.9 21.5 6 21.5H19.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M17 21V19C17 16.7909 15.2091 15 13 15H6C3.79086 15 2 16.7909 2 19V21"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="9.5" cy="7.5" r="3.5" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M22 21V19C22 17.1 20.7 15.5 19 15.1M16 4.2C17.7 4.7 19 6.2 19 8C19 9.8 17.7 11.3 16 11.8"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}
