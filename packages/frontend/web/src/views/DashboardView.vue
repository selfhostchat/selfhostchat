<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AppLayout from '../components/AppLayout.vue'

const { t, locale } = useI18n()
const router = useRouter()
const workspace = ref(null)

onMounted(() => {
  const saved = localStorage.getItem('workspace')
  if (!saved) {
    router.push('/')
    return
  }
  workspace.value = JSON.parse(saved)
  
  const savedTheme = localStorage.getItem('theme')
  const isDark = savedTheme ? savedTheme === 'dark' : true
  document.documentElement.setAttribute('data-theme', isDark ? 'selfhost-dark' : 'selfhost-light')
})
</script>

<template>
  <AppLayout>
    <div class="p-6">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-base-content">Welcome, {{ workspace?.name || 'User' }}</h1>
        <p class="text-base-content/60 mt-1">Your workspace is ready to use</p>
      </div>

      <!-- Stats cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-base-content/60 text-sm">Channels</p>
                <p class="text-2xl font-bold text-base-content">0</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0h4a1 1 0 011 1v2a1 1 0 01-1 1h-4m-8 0H3a1 1 0 00-1 1v12a1 1 0 001 1h18a1 1 0 001-1V8a1 1 0 00-1-1h-6m-8 0V4a1 1 0 011-1h2m8 0V4a1 1 0 011-1h2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-base-content/60 text-sm">Members</p>
                <p class="text-2xl font-bold text-base-content">1</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-secondary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-base-content/60 text-sm">Messages</p>
                <p class="text-2xl font-bold text-base-content">0</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-base-200 shadow">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-base-content/60 text-sm">Status</p>
                <p class="text-2xl font-bold text-success">Online</p>
              </div>
              <div class="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <div class="w-4 h-4 rounded-full bg-success animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="card bg-base-200 shadow-lg">
        <div class="card-body">
          <h2 class="card-title text-base-content mb-4">Quick Actions</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button class="btn btn-outline btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Channel
            </button>
            <button class="btn btn-outline btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Invite Member
            </button>
            <button class="btn btn-outline btn-accent">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div class="card bg-base-200 shadow mt-6">
        <div class="card-body items-center text-center py-12">
          <div class="w-24 h-24 rounded-full bg-base-300 flex items-center justify-center mb-4">
            <svg class="w-12 h-12 text-base-content/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 class="text-lg font-semibold text-base-content">No channels yet</h3>
          <p class="text-base-content/60 mt-1 max-w-sm">Create your first channel to start chatting with your team</p>
          <button class="btn btn-primary mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create First Channel
          </button>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
