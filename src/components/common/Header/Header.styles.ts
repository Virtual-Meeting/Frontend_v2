import styled, { css } from 'styled-components';
import Logo from 'assets/images/logo_main.svg?react';

type HeaderProps = {
  variant?: 'default' | 'compact';
};

export const HeaderWrapper = styled.header<HeaderProps>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  background-color: ${({ theme }) => theme.colors.background.light};
  border-bottom: ${({ theme }) => theme.borders.width} solid ${({ theme }) => theme.colors.border};

  height: ${({ variant }) => (variant === 'compact' ? '2.95rem' : '3.95rem')};
`;

export const LogoImage = styled(Logo)`
  width: auto;
  height: 100%;
  margin: ${({ theme }) => `0 ${theme.spacings.xs}`};
`;