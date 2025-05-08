"use client";

import { useReducer, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

type State = {
  email: string;
  password: string;
  error: string;
  isLoading: boolean;
};

type Action =
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_PASSWORD"; payload: string }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "RESET_FORM" };

interface LoginFormProps {
  callbackUrl?: string;
}

const initialState: State = {
  email: "",
  password: "",
  error: "",
  isLoading: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.payload };
    case "SET_PASSWORD":
      return { ...state, password: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "RESET_FORM":
      return initialState;
    default:
      return state;
  }
}

export function LoginForm({ callbackUrl = "/console" }: LoginFormProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const router = useRouter();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!state.email || !state.password) {
        dispatch({ type: "SET_ERROR", payload: "请输入邮箱和密码" });
        return;
      }

      try {
        dispatch({ type: "SET_ERROR", payload: "" });
        dispatch({ type: "SET_LOADING", payload: true });

        const result = await signIn("credentials", {
          email: state.email,
          password: state.password,
          redirect: false,
          callbackUrl: callbackUrl,
        });

        console.log("登录结果:", result);

        if (!result) {
          throw new Error("登录返回为空");
        }

        if (result.error) {
          console.error("登录错误:", result.error);
          dispatch({ type: "SET_ERROR", payload: "邮箱或密码错误" });
          return;
        }

        if (!result.ok) {
          console.error("登录失败:", result);
          dispatch({ type: "SET_ERROR", payload: "登录失败，请稍后重试" });
          return;
        }

        router.replace(result.url || callbackUrl);
      } catch (err) {
        console.error("登录异常:", err);
        dispatch({ type: "SET_ERROR", payload: "登录失败，请稍后重试" });
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [state.email, state.password, router, callbackUrl]
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4" method="post">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱"
              value={state.email}
              onChange={(e) =>
                dispatch({ type: "SET_EMAIL", payload: e.target.value })
              }
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <Input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={state.password}
              onChange={(e) =>
                dispatch({ type: "SET_PASSWORD", payload: e.target.value })
              }
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={state.isLoading}>
            {state.isLoading ? "登录中..." : "登录"}
          </Button>
          {state.error && (
            <div className="text-sm text-red-500">{state.error}</div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
