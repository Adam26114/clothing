import { Password } from '@convex-dev/auth/providers/Password';
import { convexAuth } from '@convex-dev/auth/server';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        const email = String(params.email ?? '');
        const profile = {
          email,
          role: 'customer' as const,
          isActive: true as const,
          createdAt: Date.now(),
        };
        if (params.name !== undefined) {
          return { ...profile, name: String(params.name) };
        }
        return profile;
      },
    }),
  ],
});
