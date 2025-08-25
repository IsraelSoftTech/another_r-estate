import React, { useState } from "react";
import styled from "styled-components";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaUserTag } from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import app from "../firebase";
import { getDatabase, ref, set } from "firebase/database";
import Header from "../components/Header";
import Footer from "../components/Footer";

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const Wrapper = styled.div`
  min-height: calc(100vh - 70px); // Adjust for header height
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f6f8fd;
  padding: 80px 20px; // Add top padding for header
  flex: 1;
`;

const FormBox = styled.div`
  background: #fff;
  padding: 2.5rem;
  border-radius: 16px;
  box-shadow: 0 2px 16px rgba(37,99,235,0.08);
  width: 100%;
  max-width: 400px;
  box-sizing: border-box;
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 700;
  color: #2563eb;
`;

const InputGroup = styled.div`
  margin-bottom: 1.3rem;
  width: 100%;
  box-sizing: border-box;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem 2.5rem;
  padding-right: ${props => props.type === 'password' ? '2.5rem' : '0.8rem'};
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: #f9fafd;
  outline: none;
  box-sizing: border-box;
  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.8rem 2.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  background: #f9fafd;
  outline: none;
  appearance: none;
  cursor: pointer;
  box-sizing: border-box;
  &:focus {
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37,99,235,0.1);
  }
`;

const Icon = styled.span`
  position: absolute;
  left: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #2563eb;
`;

const PasswordToggle = styled.span`
  position: absolute;
  right: 0.8rem;
  top: 50%;
  transform: translateY(-50%);
  color: #2563eb;
  cursor: pointer;
  &:hover {
    color: #1746a0;
  }
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const Button = styled.button`
  width: 100%;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 0.9rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #1746a0;
  }
`;

const TextLink = styled(Link)`
  color: #2563eb;
  text-decoration: none;
  font-weight: 500;
  &:hover {
    text-decoration: underline;
  }
`;

const FooterText = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  color: #888;
`;

const ErrorMsg = styled.div`
  color: #e74c3c;
  text-align: center;
  margin-bottom: 1rem;
`;

const SuccessMsg = styled.div`
  color: #27ae60;
  text-align: center;
  margin-bottom: 1rem;
`;

function Signup() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!username || !email || !password || !accountType) {
      setError("All fields are required.");
      return;
    }
    try {
      const db = getDatabase(app);
      await set(ref(db, `accounts/${username}`), {
        username,
        email,
        accountType,
        password
      });
      setSuccess("Account created successfully!");
      setTimeout(() => navigate("/signin"), 1500);
    } catch (err) {
      setError("Error saving account. Try again.");
    }
  };

  return (
    <PageContainer>
      <Header />
      <Wrapper>
        <FormBox>
          <Title>Sign Up</Title>
          {error && <ErrorMsg>{error}</ErrorMsg>}
          {success && <SuccessMsg>{success}</SuccessMsg>}
          <form onSubmit={handleSubmit}>
            <InputGroup>
              <InputWrapper>
                <Icon><FaUser /></Icon>
                <Input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoFocus
                />
              </InputWrapper>
            </InputGroup>
            <InputGroup>
              <InputWrapper>
                <Icon><FaEnvelope /></Icon>
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </InputWrapper>
            </InputGroup>
            <InputGroup>
              <InputWrapper>
                <Icon><FaUserTag /></Icon>
                <Select
                  value={accountType}
                  onChange={e => setAccountType(e.target.value)}
                  required
                >
                  <option value="">Select Account Type</option>
                  <option value="tenant">Tenant</option>
                  <option value="landlord">Land Lord</option>
                  <option value="technician">Technician</option>
                  <option value="council">Council</option>
                </Select>
              </InputWrapper>
            </InputGroup>
            <InputGroup>
              <InputWrapper>
                <Icon><FaLock /></Icon>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <PasswordToggle onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </PasswordToggle>
              </InputWrapper>
            </InputGroup>
            <InputGroup>
              <InputWrapper>
                <Icon><FaLock /></Icon>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
                <PasswordToggle onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </PasswordToggle>
              </InputWrapper>
            </InputGroup>
            <Button type="submit">Sign Up</Button>
          </form>
          <FooterText>
            Already have an account? <TextLink to="/signin">Sign in</TextLink>
          </FooterText>
        </FormBox>
      </Wrapper>
      <Footer />
    </PageContainer>
  );
}

export default Signup; 