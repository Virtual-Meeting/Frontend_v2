
import styled from 'styled-components';

export const Overlay = styled.div`
    display: flex;
    align-items: center;    
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1000;
`;

export const PopupContainer = styled.div`
    display:flex;
    flex-direction: column;
    width: 30%;
    max-width: 50%;
    background-color: ${({ theme }) => theme.colors.background.light};
    border-radius: ${({theme})=>theme.borders.radius.md};
    padding: ${({theme})=>theme.spacings.sm};
    z-index: 1001;
    position: relative;
`;

export const Title = styled.h2`
    font-size: ${({theme})=>theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.primary};
`;

export const Input = styled.input`
    width: 90%;
    padding: 0.75rem 5%;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({theme})=>theme.borders.radius.sm};
    margin-bottom: ${({theme})=>theme.spacings.sm};
    color: ${({theme})=>theme.colors.text.default};
    background-color: ${({ theme }) => theme.colors.background.light};

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
`;

export const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({theme})=>theme.spacings.sm};
`;

export const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border-radius: ${({theme})=>theme.borders.radius.sm};
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;

  ${({ variant = 'secondary', theme }) =>
    variant === 'primary'
      ? `
    background-color: #5F9DF7;
    color: #FFFFFF !important;

    &:hover {
      background-color: ${theme.colors.primary};
    }
  `
      : `
    background-color: ${theme.colors.background.grayLight};
    color: ${theme.colors.text.default};

    &:hover {
      background-color: #dfdfdf;
    }
  `}
`;

export const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.state.error};
  font-size: ${({theme})=>theme.fontSizes.xxs};
  margin-top: -12px;
  margin-bottom: 16px;
`;
