import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import { ThemeToggleButton } from "../../components/common/ThemeToggleButton";
import { isAuthenticated, loginWithVccGroup, } from "../../auth/auth";
export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    if (isAuthenticated()) {
        return <Navigate to="/" replace/>;
    }
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        const normalizedUsername = username.trim();
        if (!normalizedUsername || !password) {
            setError("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
            return;
        }
        try {
            setIsSubmitting(true);
            await loginWithVccGroup(normalizedUsername, password);
            const state = location.state;
            navigate(state?.from || "/", {
                replace: true,
            });
        }
        catch (err) {
            if (err instanceof TypeError) {
                setError("Không thể kết nối tới máy chủ VCC Group. Vui lòng kiểm tra địa chỉ API hoặc kết nối mạng.");
            }
            else if (err instanceof Error) {
                setError(err.message);
            }
            else {
                setError("Đăng nhập thất bại. Vui lòng thử lại.");
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };
    return (<>
      <PageMeta title="Login | VCC Plastics" description="Login page for VCC Plastics Management System"/>

      <div className="relative min-h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
        <div className="absolute right-4 top-4 z-20">
          <ThemeToggleButton />
        </div>

        <div className="grid min-h-screen lg:grid-cols-2">
          {/* LEFT SIDE */}
          <div className="relative hidden overflow-hidden bg-gray-900 lg:flex lg:items-center lg:justify-center">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full border border-white/20"/>
              <div className="absolute bottom-[-120px] right-[-80px] h-96 w-96 rounded-full border border-white/20"/>
              <div className="absolute left-1/3 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full border border-white/10"/>
            </div>

            <div className="relative z-10 max-w-xl px-14 text-center">
              <img src="/images/logo/logo-dark.png" alt="VCC Plastics" className="mx-auto mb-10 w-full max-w-[360px] object-contain"/>

              <h1 className="text-3xl font-semibold text-white xl:text-4xl">
                VCC Plastics Management System
              </h1>

              <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-gray-300">
                Hệ thống quản lý sản xuất, máy móc, khuôn,
                chất lượng, vật tư và vận hành nhà máy VCC
                Plastics.
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-8 lg:px-12">
            <div className="w-full max-w-md">
              {/* MOBILE LOGO */}
              <div className="mb-9 lg:hidden">
                <img src="/images/logo/logo.png" alt="VCC Plastics" className="h-auto w-[230px] object-contain dark:hidden"/>

                <img src="/images/logo/logo-dark.png" alt="VCC Plastics" className="hidden h-auto w-[230px] object-contain dark:block"/>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-9">
                <div className="mb-7">
                  <p className="mb-2 text-sm font-medium text-brand-500">
                    VCC Plastics
                  </p>

                  <h2 className="text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-3xl">
                    Đăng nhập hệ thống
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    Sử dụng tài khoản VCC Group để đăng nhập.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* USERNAME */}
                  <div>
                    <label htmlFor="username" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tài khoản
                    </label>

                    <input id="username" name="username" type="text" autoComplete="username" value={username} disabled={isSubmitting} onChange={(event) => setUsername(event.target.value)} placeholder="Nhập mã nhân viên" className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"/>
                  </div>

                  {/* PASSWORD */}
                  <div>
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mật khẩu
                    </label>

                    <div className="relative">
                      <input id="password" name="password" type={showPassword
            ? "text"
            : "password"} autoComplete="current-password" value={password} disabled={isSubmitting} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-12 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-70 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"/>

                      <button type="button" disabled={isSubmitting} onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200" aria-label={showPassword
            ? "Ẩn mật khẩu"
            : "Hiện mật khẩu"}>
                        {showPassword ? (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M3 3L21 21" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>

                            <path d="M10.6 10.7A2 2 0 0013.3 13.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>

                            <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.1 0 8.5 4.4 9 7-.2 1.1-.9 2.5-2 3.7M6.4 6.4C4.5 7.8 3.3 10 3 12c.5 2.6 3.9 7 9 7 1.4 0 2.7-.3 3.8-.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>) : (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M3 12s3.2-7 9-7 9 7 9 7-3.2 7-9 7-9-7-9-7Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>

                            <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7"/>
                          </svg>)}
                      </button>
                    </div>
                  </div>

                  {/* ERROR */}
                  {error && (<div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-900/50 dark:bg-error-500/10 dark:text-error-400">
                      {error}
                    </div>)}

                  {/* LOGIN BUTTON */}
                  <button type="submit" disabled={isSubmitting} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-brand-500 px-5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 focus:outline-none focus:ring-3 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-70">
                    {isSubmitting
            ? "Đang đăng nhập..."
            : "Đăng nhập"}
                  </button>
                </form>

                <div className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500">
                  Tài khoản đăng nhập được xác thực thông qua
                  hệ thống VCC Group.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>);
}
