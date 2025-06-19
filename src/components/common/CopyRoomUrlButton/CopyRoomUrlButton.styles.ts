import styled from 'styled-components';

export const Button = styled.button`
    width:90%;
    padding:${({theme})=>theme.spacings.xs} 0;
    // height: 2.95rem;  /* 높이 고정 */
    font-size: ${({theme})=>theme.fontSizes.xxs};
    cursor: pointer;
    border-radius: 4px;
    border: 1px solid ${({theme})=>theme.colors.background.gray};
    background-color: ${({theme})=>theme.colors.background.light};
    margin-bottom:${({theme})=>theme.spacings.xs};
    
    &:hover {
    background-color: #eee;
    }
`;