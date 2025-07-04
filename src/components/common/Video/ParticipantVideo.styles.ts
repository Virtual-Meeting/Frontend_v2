import styled from 'styled-components';

export const ParticipantContainer = styled.div<{ isPreview?: boolean, isSpeaking?: boolean }>`
  position: relative;
  width: ${({ isPreview }) => (isPreview && '70%' )};
  min-width: 220px;
  aspect-ratio: 16 / 9;
  background-color: transparent;
  border-radius: ${({theme}) => theme.borders.radius.md};
  border: 3px solid;
  border-color: ${({ isSpeaking }) => (isSpeaking ? '#00ff3c' : 'transparent')};
  overflow: hidden;
`;

export const StyledVideo = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const Placeholder = styled.div<{ isPreview?: boolean, bgColor?: string }>`
  width: 100%;
  height: 100%;
  background-color: #444;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;

  span{
    display: inline-flex;
    background-color:${({ bgColor }) => bgColor || '#444'};
    aspect-ratio: 1 / 1;
    width: 20%;
    border-radius:${({theme})=>theme.borders.radius.round};
    align-items: center;
    justify-content: center;
    font-size: ${({ isPreview, theme }) => (isPreview && theme.fontSizes.xl )};
    overflow: hidden;
  }
`;

export const UsernameOverlay = styled.div`
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  padding: 0.3rem 0.75rem;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: ${({theme}) => theme.borders.radius.round};
  max-width: 80%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;


export const UsernameContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
`;

export const Icon = styled.span`
  display: flex;
  align-items: center;

  svg {
    width: 1rem;
    height: 1rem;
    fill: currentColor;
  }
`;
