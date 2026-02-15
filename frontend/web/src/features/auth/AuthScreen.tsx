import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-screen">
      <div className="auth-container">
        {isLogin ? <LoginForm /> : <RegisterForm />}
        
        <p>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            className="link-button"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div㸂
  );
}
