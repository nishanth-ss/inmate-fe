import React, { useEffect, useState } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Camera, Shield } from "lucide-react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import FaceRecognition from '@/components/faceidcomponent/FaceId';

const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: Yup.string()
    .required('Password is required')
    .min(4, 'Password must be at least 6 characters'),
});

const Login = () => {
  const navigate = useNavigate()

  const { enqueueSnackbar } = useSnackbar();

  const [openFaceId, setOpenFaceId] = useState(false);
  const [faceidData,setFaceIdData] = useState(null);

  useEffect(() => {
    const loginUser = async () => {
      if (!faceidData) return; // Only run if data exists
  
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}user/login`,
          {descriptor:faceidData}
        );
  
        localStorage.setItem("authToken", res.data?.token);
        localStorage.setItem("role", res.data?.user?.role);
        localStorage.setItem("username", res.data?.user?.username);
  
        enqueueSnackbar("User Logged In Successfully", { variant: "success" });
  
        if (res.status === 200) {
          navigate(
            res.data?.user?.role === "POS"
              ? "/tuck-shop-pos"
              : res.data?.user?.role === "INMATE"
              ? "/inmate-profile"
              : "/dashboard"
          );
        }
      } catch (error) {
        enqueueSnackbar(error?.response?.data?.message || "Something went wrong", {
          variant: "error",
        });
      }
    };
  
    loginUser();
  }, [faceidData]);  

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-blue-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="text-primary text-2xl" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            InMate Financial System
          </CardTitle>
          <p className="text-gray-600 mt-2">Admin Dashboard Login</p>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={{ username: '', password: '' }}
            validationSchema={LoginSchema}
            onSubmit={async (values) => {
              try {
                const response = await axios.post(
                  `${import.meta.env.VITE_API_URL}user/login`,
                  values
                ).then((res) => {
                  localStorage.setItem("authToken", res.data?.token)
                  localStorage.setItem("role", res.data?.user?.role)
                  localStorage.setItem("username", res.data?.user?.username)
                  enqueueSnackbar("User Logined Successfully", {
                    variant: 'success',
                  });
                  res?.status == 200 ? navigate(res.data?.user?.role == "POS" ? "/tuck-shop-pos" : res.data?.user?.role == "INMATE" ? "/inmate-profile" : '/dashboard') : null
                })
              } catch (error) {
                enqueueSnackbar(error?.response?.data?.message || "Something went wrong", {
                  variant: 'error',
                });
              }
            }}
          >
            {({ handleChange, handleBlur, values, errors, touched }) => (
              <Form className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.username}
                  />
                  {touched.username && errors.username && (
                    <p className="text-red-500 text-sm">{errors.username}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    onChange={handleChange}
                    onBlur={handleBlur}
                    value={values.password}
                  />
                  {touched.password && errors.password && (
                    <p className="text-red-500 text-sm">{errors.password}</p>
                  )}
                </div>
                <div>
                  <Button type="button" onClick={() => setOpenFaceId(true)} className="bg-gray-500 text-white w-full">
                    <Camera />
                    Verify Face ID
                  </Button>
                </div>
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>

      {openFaceId && (
        <FaceRecognition mode="match" open={openFaceId} setOpen={setOpenFaceId} setFaceIdData={setFaceIdData} />
      )}
    </div>
  );
};

export default Login;
