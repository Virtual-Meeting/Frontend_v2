import './App.css';
import styled from 'styled-components';

// ✅ 스타일드 컴포넌트 정의
const StyledButton = styled.button`
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #388e3c;
  }
`;

function App() {
  return (
    <div className="App">
       <div style={{ padding: '50px' }}>
        <h1>Styled Components 테스트</h1>
        <StyledButton>눌러보세요</StyledButton>
      </div>
    </div>
  );
}

export default App;
