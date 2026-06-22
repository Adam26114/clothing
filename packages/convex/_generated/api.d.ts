/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as inventory from "../inventory.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as seed from "../seed.js";
import type * as seedInternal from "../seedInternal.js";
import type * as storage from "../storage.js";
import type * as storeSettings from "../storeSettings.js";
import type * as users from "../users.js";
import type * as wishlistItems from "../wishlistItems.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  cart: typeof cart;
  categories: typeof categories;
  inventory: typeof inventory;
  orders: typeof orders;
  products: typeof products;
  seed: typeof seed;
  seedInternal: typeof seedInternal;
  storage: typeof storage;
  storeSettings: typeof storeSettings;
  users: typeof users;
  wishlistItems: typeof wishlistItems;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
