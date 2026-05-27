<template>
  <div class="min-h-screen bg-base-100 flex items-center justify-center p-4">
    <!-- Theme toggle & Language switcher -->
    <div class="absolute top-4 right-4 flex items-center gap-2">
      <label class="swap swap-rotate">
        <input type="checkbox" @change="toggleTheme" :checked="isDark" />
        <svg class="swap-on h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg class="swap-off h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      </label>
      <div class="dropdown dropdown-end">
        <div tabindex="0" role="button" class="btn btn-ghost btn-sm gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span class="text-xs uppercase font-medium">{{ locale }}</span>
        </div>
        <ul tabindex="0" class="dropdown-content z-50 menu menu-sm p-2 shadow bg-base-200 rounded-box w-36 border border-base-300">
          <li><a :class="{ 'active': locale === 'vi' }" @click="switchLocale('vi')">Tiếng Việt</a></li>
          <li><a :class="{ 'active': locale === 'en' }" @click="switchLocale('en')">English</a></li>
        </ul>
      </div>
    </div>

    <!-- Main card -->
    <div class="card bg-base-200 shadow-2xl w-full max-w-md">
      <div class="card-body p-8">
        <!-- Logo & Title -->
        <div class="text-center mb-8">
          <div class="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
            <svg class="w-12 h-12 text-primary-content" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold text-base-content">{{ tx('title') }}</h1>
          <p class="text-base-content/60 mt-2">{{ tx('subtitle') }}</p>
        </div>

        <!-- Progress steps -->
        <div class="flex justify-center gap-2 mb-8">
          <div class="w-10 h-1 rounded-full transition-all duration-300" :class="step >= 1 ? 'bg-primary' : 'bg-base-300'"></div>
          <div class="w-10 h-1 rounded-full transition-all duration-300" :class="step >= 2 ? 'bg-primary' : 'bg-base-300'"></div>
        </div>

        <!-- Step 1: Business Name -->
        <div v-if="step === 1" class="space-y-6">
          <div class="text-center">
            <h2 class="text-lg font-semibold text-base-content">{{ tx('step1Title') }}</h2>
            <p class="text-sm text-base-content/60 mt-1">{{ tx('step1Subtitle') }}</p>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-base-content font-medium">{{ tx('workspaceName') }}</span>
            </label>
            <input
              v-model="businessName"
              type="text"
              :placeholder="tx('workspaceNamePlaceholder')"
              class="input input-bordered input-primary w-full bg-base-100"
              @keyup.enter="nextStep"
            />
          </div>

          <div v-if="error" class="alert alert-error py-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm">{{ error }}</span>
          </div>

          <button class="btn btn-primary w-full" @click="nextStep">
            {{ tx('continue') }}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

        <!-- Step 2: Admin Account -->
        <div v-if="step === 2" class="space-y-6">
          <div class="text-center">
            <h2 class="text-lg font-semibold text-base-content">{{ tx('step2Title') }}</h2>
            <p class="text-sm text-base-content/60 mt-1">{{ tx('step2Subtitle') }}</p>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-base-content font-medium">{{ tx('usernameLabel') }}</span>
            </label>
            <input
              v-model="username"
              type="text"
              class="input input-bordered input-primary w-full bg-base-100"
              disabled
            />
            <label class="label">
              <span class="label-text-alt text-base-content/50">{{ tx('usernameHint') }}</span>
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text text-base-content font-medium">{{ tx('passwordLabel') }}</span>
            </label>
            <div class="relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                :placeholder="tx('passwordPlaceholder')"
                class="input input-bordered input-primary w-full bg-base-100 pr-12"
                @keyup.enter="nextStep"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="error" class="alert alert-error py-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-sm">{{ error }}</span>
          </div>

          <div class="space-y-2">
            <button
              class="btn btn-primary w-full"
              @click="nextStep"
              :disabled="isLoading"
            >
              <span v-if="isLoading" class="loading loading-spinner loading-sm"></span>
              <span v-else>{{ tx('createWorkspace') }}</span>
            </button>
            <button class="btn btn-ghost w-full" @click="step = 1" :disabled="isLoading">
              {{ tx('back') }}
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center text-xs text-base-content/40">
          {{ tx('footer') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import { usePageTranslation } from '../composables/usePageTranslation'
import { i18n } from '../i18n/index.js'

const { locale } = useI18n()
const router = useRouter()

const { tx } = usePageTranslation(() => translator)

const isDark = ref(true)
const businessName = ref('')
const username = ref('root')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const error = ref('')
const step = ref(1)

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

onMounted(async () => {
  const saved = localStorage.getItem('theme')
  if (saved) {
    isDark.value = saved === 'dark'
  }
  document.documentElement.setAttribute('data-theme', isDark.value ? 'selfhost-dark' : 'selfhost-light')

  try {
    const res = await axios.get(`${API_URL}/config/status`)
    if (res.data.configured) {
      router.push('/login')
    }
  } catch {
  }
})

const switchLocale = (lang: 'en' | 'vi') => {
  i18n.global.locale.value = lang
  localStorage.setItem('locale', lang)
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.documentElement.setAttribute('data-theme', isDark.value ? 'selfhost-dark' : 'selfhost-light')
}

const nextStep = () => {
  error.value = ''
  if (step.value === 1 && !businessName.value.trim()) {
    error.value = tx('workspaceNameError')
    return
  }
  if (step.value === 1) {
    step.value = 2
    return
  }
  if (step.value === 2 && !password.value) {
    error.value = tx('passwordError')
    return
  }
  if (step.value === 2 && password.value.length < 6) {
    error.value = tx('passwordMinError')
    return
  }
  setupWorkspace()
}

const setupWorkspace = async () => {
  isLoading.value = true
  error.value = ''

  try {
    const res = await axios.post(`${API_URL}/config/setup`, {
      organizationName: businessName.value,
      adminUsername: username.value,
      adminPassword: password.value,
    })

    localStorage.setItem('workspace', JSON.stringify({
      name: res.data.data.organizationName,
      workspaceId: res.data.data.workspaceId,
      username: username.value,
      createdAt: new Date().toISOString(),
    }))

    router.push('/dashboard')
  } catch (err: any) {
    if (err.response?.status === 409) {
      error.value = tx('adminUsernameExists')
    } else {
      error.value = err.response?.data?.error || tx('failedToSetup')
    }
    isLoading.value = false
  }
}

const translator = {
  en: {
    title: 'Welcome to SelfHostChat',
    subtitle: 'Your self-hosted communication platform',
    step1Title: "Let's get started",
    step1Subtitle: 'Enter your workspace details',
    workspaceName: 'Business / Workspace Name',
    workspaceNamePlaceholder: 'My Company',
    workspaceNameError: 'Please enter your business name',
    continue: 'Continue',
    step2Title: 'Create Admin Account',
    step2Subtitle: 'Set up your root administrator',
    usernameLabel: 'Username',
    usernameHint: 'Default: root - cannot be changed',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password (min 6 chars)',
    passwordError: 'Please enter your password',
    passwordMinError: 'Password must be at least 6 characters',
    createWorkspace: 'Create Workspace',
    back: 'Back',
    footer: 'SelfHostChat v1.0 • Self-hosted communication',
    adminUsernameExists: 'Admin username already exists',
    failedToSetup: 'Failed to setup. Please try again.',
  },
  vi: {
    title: 'Chào mừng đến SelfHostChat',
    subtitle: 'Nền tảng giao tiếp tự lưu trữ',
    step1Title: 'Bắt đầu ngay',
    step1Subtitle: 'Nhập thông tin workspace của bạn',
    workspaceName: 'Tên doanh nghiệp / Workspace',
    workspaceNamePlaceholder: 'Công ty của tôi',
    workspaceNameError: 'Vui lòng nhập tên doanh nghiệp',
    continue: 'Tiếp tục',
    step2Title: 'Tạo tài khoản Admin',
    step2Subtitle: 'Thiết lập quản trị viên root',
    usernameLabel: 'Tên đăng nhập',
    usernameHint: 'Mặc định: root - không thể thay đổi',
    passwordLabel: 'Mật khẩu',
    passwordPlaceholder: 'Nhập mật khẩu (tối thiểu 6 ký tự)',
    passwordError: 'Vui lòng nhập mật khẩu',
    passwordMinError: 'Mật khẩu phải có ít nhất 6 ký tự',
    createWorkspace: 'Tạo Workspace',
    back: 'Quay lại',
    footer: 'SelfHostChat v1.0 • Tự chủ hoàn toàn',
    adminUsernameExists: 'Tên người dùng admin đã tồn tại',
    failedToSetup: 'Thiết lập thất bại. Vui lòng thử lại.',
  },
}
</script>
