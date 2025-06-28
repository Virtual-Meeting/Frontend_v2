import styled from 'styled-components';

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

export const Popup = styled.div`
  background: ${({ theme }) => theme.colors.chat.background};
  padding: 2rem;
  border-radius: ${({ theme }) => theme.borders.radius.md};
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  text-align: center;
  max-width: 360px;
  width: 90%;
`;

export const Message = styled.p`
  color: ${({ theme }) => theme.colors.text.default};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-bottom: 2rem;
`;

export const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
`;

export const ConfirmButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  flex: 1;
  padding: 0.75rem 1rem;
  background-color: ${({ theme, variant }) =>
    variant === 'secondary' ? '#ccc' : theme.colors.primary};
  color: ${({ variant }) => (variant === 'secondary' ? '#333' : '#FFFFFF')} !important;
  border: none;
  border-radius: ${({ theme }) => theme.borders.radius.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: ${({ theme, variant }) =>
      variant === 'secondary' ? '#b3b3b3' : theme.colors.hover};
  }
`;