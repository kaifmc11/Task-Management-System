import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import Textbox from "../components/Textbox";
import Button from "../components/Button";
import { useDispatch, useSelector } from "react-redux";
import { useLoginMutation } from "../redux/slices/api/authApiSlice";
import Loading from "../components/Loader";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { setCredentials } from "../redux/slices/authSlice";
import RegisterPage from "../components/RegisterPage";
import { AlertCircle } from 'lucide-react';

// Add this CSS to your stylesheets
const animationStyles = `
  @keyframes rotateInUpLeft {
    from {
      transform: rotate3d(0, 0, 1, 45deg);
      opacity: 0;
    }
    to {
      transform: rotate3d(0, 0, 1, 0deg);
      opacity: 1;
    }
  }

  @keyframes float {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
    100% {
      transform: translateY(0px);
    }
  }

  .cell {
    width: 200px;
    height: 200px;
    margin: 0 auto;
    position: relative;
    animation: float 6s ease-in-out infinite;
  }

  .circle {
    width: 200px;
    height: 200px;
    background: linear-gradient(45deg, #3b82f6, #1d4ed8);
    border-radius: 50%;
    position: absolute;
    animation: rotateInUpLeft 2s ease-out;
    box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
  }

  .circle::before {
    content: '';
    position: absolute;
    width: 180px;
    height: 180px;
    background: white;
    border-radius: 50%;
    top: 10px;
    left: 10px;
  }

  .circle::after {
    content: '';
    position: absolute;
    width: 160px;
    height: 160px;
    background: linear-gradient(45deg, #3b82f6, #1d4ed8);
    border-radius: 50%;
    top: 20px;
    left: 20px;
  }

  .pulse {
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const Login = () => {
  const { user } = useSelector((state) => state.auth);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showRegister, setShowRegister] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [login, { isLoading }] = useLoginMutation();

  const submitHandler = async (data) => {
    try {
      setLoginError("");
      const result = await login(data).unwrap();
      dispatch(setCredentials(result));
      navigate("/");
    } catch (error) {
      console.log(error);
      setLoginError(error?.data?.message || "Invalid email or password");
      toast.error(error?.data?.message || "Invalid email or password");
    }
  };

  useEffect(() => {
    user && navigate("/dashboard");
  }, [user]);

  return (
    <>
      <style>{animationStyles}</style>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
          {/* Left side - Branding */}
          <div className="w-full lg:w-1/2 space-y-12 text-center lg:text-left">
            <div className="space-y-8">
              <span className="inline-flex items-center px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg text-blue-800 text-base font-medium border border-blue-100 pulse">
                Organize all your tasks in a single location
              </span>
              
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-7xl font-black tracking-tight bg-gradient-to-r from-blue-700 to-blue-900 bg-clip-text text-transparent">
                  DIG
                  <span className="text-red-600">I</span>
                  COGNI
                  <span className="text-red-600">T</span>
                </h1>
                
                <p className="text-3xl lg:text-4xl font-extrabold text-blue-950 tracking-wide">
                  TASK MANAGER
                </p>
              </div>
            </div>

            {/* Enhanced animation */}
            <div className="relative">
              <div className="cell">
                <div className="circle"></div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="w-full lg:w-1/2 max-w-md">
            <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-sm border border-white/50">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
                <p className="text-gray-600 mt-2">Keep all your credentials safe.</p>
              </div>

              {loginError && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm">{loginError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit(submitHandler)} className="space-y-6">
                <div className="space-y-4">
                  <Textbox
                    placeholder="email@example.com"
                    type="email"
                    name="email"
                    label="Email Address"
                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    register={register("email", {
                      required: "Email Address is required!",
                    })}
                    error={errors.email ? errors.email.message : ""}
                  />
                  
                  <Textbox
                    placeholder="Enter your password"
                    type="password"
                    name="password"
                    label="Password"
                    className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    register={register("password", {
                      required: "Password is required!",
                    })}
                    error={errors.password ? errors.password.message : ""}
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button type="button" className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                    Forgot Password?
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    Register here
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center">
                    <Loading />
                  </div>
                ) : (
                  <Button
                    type="submit"
                    label="Sign In"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  />
                )}
              </form>
            </div>
          </div>
        </div>

        <RegisterPage show={showRegister} onClose={() => setShowRegister(false)} />
      </div>
    </>
  );
};

export default Login;