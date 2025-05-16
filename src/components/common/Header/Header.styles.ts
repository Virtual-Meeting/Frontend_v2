import styled from 'styled-components';
import { ReactComponent as Logo } from 'assets/images/logo_main.svg';

export const HeaderWrapper = styled.header`
    display: flex;
    justify-content: space-between;
    width: 100%;
    background-color:${({theme}) => theme.colors.background.light};
    border-bottom: ${({ theme }) => theme.borders.width} solid ${({ theme }) => theme.colors.border};
`;

export const LogoImage = styled(Logo)`
    width:6.583rem;
    height:auto;
    margin: ${({theme}) => `0 ${theme.spacings.xs}`} ;
`;