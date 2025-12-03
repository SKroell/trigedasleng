import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  
  route("search", "routes/search.tsx"),
  
  route("dictionary", "routes/dictionary.tsx", { id: "dictionary-index" }),
  route("dictionary/:dictionary", "routes/dictionary.tsx", { id: "dictionary-param" }),
  
  route("word/:word", "routes/word.$word.tsx"),
  
  route("translations", "routes/translations.tsx"),
  
  route("sources", "routes/sources.tsx"),
  route("grammar", "routes/grammar.tsx"),
  route("learn", "routes/learn.tsx"),
  
  route("login", "routes/auth/login.tsx"),
  route("signup", "routes/auth/signup.tsx"),
  
  route("admin/addword", "routes/admin/addword.tsx"),
  route("admin/addtranslation", "routes/admin/addtranslation.tsx"),
  
  route("community", "routes/community.tsx"),
] satisfies RouteConfig;
