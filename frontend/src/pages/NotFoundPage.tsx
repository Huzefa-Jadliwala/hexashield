/** @jsxImportSource @emotion/react */
import { Link } from "react-router-dom";
import { css, Global } from "@emotion/react";
import img404 from "../assests/images/img404.png";

export default function NotFoundPage() {
  return (
    <>
      {/* Global Styles */}
      <Global
        styles={css`
          body, html {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #202840;
          }
        `}
      />

      <div css={pageContainerStyle}>
        {/* Left Content */}
        <div css={leftContentStyle}>
          <h1 css={errorCodeStyle}>404</h1>
          <h2 css={errorMessageStyle}>OOOps! Page Not Found</h2>
          <p css={errorDescriptionStyle}>
            This Page doesn’t exist or was removed!
            <br />
            We suggest you go back to home.
          </p>
          <Link to="/">
            <button css={buttonStyle}>Back to Homepage</button>
          </Link>
        </div>

        {/* Right Illustration Content */}
        <div css={illustrationContainerStyle}>
          <div css={illustrationBoxStyle}>
            <img
              src={img404}
              alt="404 Illustration"
              css={illustrationImageStyle}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/* Emotion Styles */
const pageContainerStyle = css`
  display: flex;
  align-items: center;
  height: 100vh;
  color: #fff;
  font-family: Arial, sans-serif;
  margin: 0 10%;
  justify-content: space-between;

  @media (max-width: 768px) {
    flex-direction: column;
    margin: 0 5%;
    text-align: center;
  }
`;

const leftContentStyle = css`
  flex: 1;
  text-align: center;

  @media (max-width: 768px) {
    margin-bottom: 30px;
  }
`;

const errorCodeStyle = css`
  font-size: 100px;
  font-weight: bold;
  margin: 0;
  color: #ffffff;

  @media (max-width: 768px) {
    font-size: 70px;
  }
`;

const errorMessageStyle = css`
  font-size: 30px;
  margin: 10px 0;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const errorDescriptionStyle = css`
  font-size: 16px;
  color: #b2b6c3;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const buttonStyle = css`
  background-color: #bf74f6;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  color: #fff;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #a55ce6;
  }

  @media (max-width: 768px) {
    font-size: 14px;
    padding: 8px 16px;
  }
`;

const illustrationContainerStyle = css`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const illustrationBoxStyle = css`
  background-color: #2a385d;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 100%;
  text-align: center;

  @media (max-width: 768px) {
    padding: 15px;
  }
`;

const illustrationImageStyle = css`
  width: 100%;
  max-width: 400px;
  height: auto;
  border-radius: 10px;

  @media (max-width: 768px) {
    max-width: 300px;
  }
`;
