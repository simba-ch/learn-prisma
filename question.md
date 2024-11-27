# 强制 1-1 关系 ​

在以下示例中，profile 和 profileId 是必需的。这意味着您无法在不连接或创建配置文件的情况下创建用户：

```prisma
model User {
  id        Int     @id @default(autoincrement())
  profile   Profile @relation(fields: [profileId], references: [id]) // references `id` of `Profile`
  profileId Int     @unique // relation scalar field (used in the `@relation` attribute above)
}

model Profile {
  id   Int   @id @default(autoincrement())
  user User?
}

```

**question**： 如果使用嵌套创建，能不能同时创建 `user` 和 `profile`
**answer**：可以

# 关系计数_count的使用

# select 和 include 的实质区别（似乎可以共同使用）