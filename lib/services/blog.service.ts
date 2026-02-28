// lib/services/blog.service.ts
// Blog Service -- re-exports from lib/blog.ts for barrel consistency
// The blog service logic lives in lib/blog.ts (blogService + blogCategories).
// This file re-exports it so that lib/services/index.ts can provide a
// unified import path:  import { blogService } from "@/lib/services"
export { blogService, blogCategories, type Blog } from "../blog";