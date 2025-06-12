import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// 您可以在这里定义您的 NextAuth 认证配置
const authOptions = {
  providers: [
    // 凭证提供商示例
    // 适用于使用用户名/密码或自定义认证逻辑的场景
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "用户名", type: "text", placeholder: "jsmith" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials, req) {
        // 在这里添加您的认证逻辑
        // 例如，调用您的后端 API 进行用户验证
        if (
          credentials?.username === "user" &&
          credentials?.password === "password"
        ) {
          // 如果认证成功，返回一个用户对象
          return { id: "1", name: "J Smith", email: "jsmith@example.com" };
        }
        // 如果认证失败，返回 null
        return null;
      },
    }),
    // TODO: 如果需要，您可以在这里添加其他认证提供商，例如 GitHub, Google 等
    // GitHubProvider({
    //   clientId: process.env.GITHUB_ID,
    //   clientSecret: process.env.GITHUB_SECRET,
    // }),
    // GoogleProvider({
    //   clientId: process.env.GOOGLE_CLIENT_ID,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // }),
  ],
  // TODO: 根据您的需求配置其他选项，例如回调函数、页面等
  // callbacks: {
  //   async jwt({ token, user }) {
  //     if (user) {
  //       token.id = user.id;
  //     }
  //     return token;
  //   },
  //   async session({ session, token }) {
  //     session.user.id = token.id;
  //     return session;
  //   },
  // },
  // pages: {
  //   signIn: '/auth/signin', // 自定义登录页面
  // },
  // secret: process.env.NEXTAUTH_SECRET, // 生产环境必须设置
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
