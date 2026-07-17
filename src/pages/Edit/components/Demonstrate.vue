<template>
  <div class="demonstrateContainer" :class="{ isDark: isDark }">
    <el-tooltip
      class="item"
      effect="dark"
      :content="$t('demonstrate.demonstrate')"
      placement="top"
    >
      <div class="btn iconfont iconyanshibofang" @click="enterDemoMode"></div>
    </el-tooltip>
    <div
      class="exitDemonstrateBtn"
      @click="exit"
      ref="exitDemonstrateBtnRef"
      v-if="isEnterDemonstrate"
      @mousedown.stop
      @mousemove.stop
      @mouseup.stop
    >
      <span class="icon iconfont iconguanbi"></span>
    </div>
    <div
      class="stepBox"
      ref="stepBoxRef"
      v-if="isEnterDemonstrate"
      @mousedown.stop
      @mousemove.stop
      @mouseup.stop
    >
      <div class="jump" @click="prev" :class="{ disabled: curStepIndex <= 0 }">
        <span class="icon">&lt;</span>
      </div>
      <div class="step">{{ curStepIndex + 1 }} / {{ totalStep }}</div>
      <div
        class="jump"
        @click="next"
        :class="{ disabled: curStepIndex >= totalStep - 1 }"
      >
        <span class="icon">&gt;</span>
      </div>
      <div class="input">
        <input
          type="text"
          name="demonstrateStep"
          aria-label="跳转演示步骤"
          v-model="inputStep"
          @keyup.enter.stop="onEnter"
          @keydown.stop
        />
      </div>
    </div>
    <div
      class="speakerNotes"
      ref="speakerNotesRef"
      v-if="isEnterDemonstrate && speakerNote"
      @mousedown.stop
      @mousemove.stop
      @mouseup.stop
    >
      <div class="speakerNotesTitle">
        {{ $t('demonstrate.speakerNotes') || '演讲者备注' }}
      </div>
      <div class="speakerNotesBody">{{ speakerNote }}</div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    mindMap: {
      type: Object
    },
    isDark: {
      type: Boolean
    }
  },
  data() {
    return {
      isEnterDemonstrate: false,
      curStepIndex: 0,
      totalStep: 0,
      inputStep: '',
      speakerNote: ''
    }
  },
  created() {
    this.$bus.$on('demonstrate_jump', this.onJump)
    this.$bus.$on('exit_demonstrate', this.onExit)
    this.$bus.$on('enter_demonstrate', this.enterDemoMode)
    window.addEventListener('keydown', this.handleDemonstrateKeydown)
  },
  beforeUnmount() {
    this.$bus.$off('demonstrate_jump', this.onJump)
    this.$bus.$off('exit_demonstrate', this.onExit)
    this.$bus.$off('enter_demonstrate', this.enterDemoMode)
    window.removeEventListener('keydown', this.handleDemonstrateKeydown)
  },
  methods: {
    handleDemonstrateKeydown(event) {
      // F5 enter demonstrate when not already in it
      if (event.key === 'F5' && !this.isEnterDemonstrate) {
        // allow browser default only if prevented? prevent for app UX
        event.preventDefault()
        this.enterDemoMode()
        return
      }
      if (!this.isEnterDemonstrate) return
      if (event.key === 'Escape') {
        event.preventDefault()
        this.exit()
        return
      }
      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault()
        this.next()
        return
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        this.prev()
      }
    },
    enterDemoMode() {
      this.isEnterDemonstrate = true
      this.speakerNote = ''
      this.$nextTick(() => {
        const el = document.querySelector('#mindMapContainer')
        el.appendChild(this.$refs.exitDemonstrateBtnRef)
        el.appendChild(this.$refs.stepBoxRef)
        if (this.$refs.speakerNotesRef) {
          el.appendChild(this.$refs.speakerNotesRef)
        }
      })
      this.mindMap.demonstrate.enter()
    },

    exit() {
      this.mindMap.demonstrate.exit()
    },

    onExit() {
      this.isEnterDemonstrate = false
      this.curStepIndex = 0
      this.totalStep = 0
      this.speakerNote = ''
      this.$nextTick(() => {
        const el = document.querySelector('#mindMapContainer')
        if (el && this.$refs.exitDemonstrateBtnRef?.parentNode === el) {
          el.removeChild(this.$refs.exitDemonstrateBtnRef)
        }
        if (el && this.$refs.stepBoxRef?.parentNode === el) {
          el.removeChild(this.$refs.stepBoxRef)
        }
        if (el && this.$refs.speakerNotesRef?.parentNode === el) {
          el.removeChild(this.$refs.speakerNotesRef)
        }
      })
    },

    resolveSpeakerNote(index) {
      try {
        const demo = this.mindMap?.demonstrate
        const step = demo?.stepList?.[index]
        const nodeData = step?.node
        if (!nodeData) return ''
        // Prefer live canvas node note when instance exists
        const uid = nodeData.data?.uid || nodeData.getData?.('uid')
        const live =
          uid && this.mindMap.renderer?.findNodeByUid
            ? this.mindMap.renderer.findNodeByUid(uid)
            : null
        const raw =
          live?.getData?.('note') ||
          nodeData.getData?.('note') ||
          nodeData.data?.note ||
          ''
        return String(raw || '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
      } catch (_error) {
        return ''
      }
    },

    onJump(index, total) {
      this.curStepIndex = index
      this.totalStep = total
      this.speakerNote = this.resolveSpeakerNote(index)
      this.$nextTick(() => {
        const el = document.querySelector('#mindMapContainer')
        if (
          el &&
          this.$refs.speakerNotesRef &&
          this.speakerNote &&
          this.$refs.speakerNotesRef.parentNode !== el
        ) {
          el.appendChild(this.$refs.speakerNotesRef)
        }
      })
    },

    prev() {
      this.mindMap.demonstrate.prev()
    },

    next() {
      this.mindMap.demonstrate.next()
    },

    onEnter() {
      const num = Number(this.inputStep)
      if (Number.isNaN(num)) {
        this.inputStep = ''
      } else if (num >= 1 && num <= this.totalStep) {
        this.mindMap.demonstrate.jump(num - 1)
      }
    }
  }
}
</script>

<style lang="less" scoped>
.demonstrateContainer {
  display: flex;
  align-items: center;

  &.isDark {
    .btn {
      color: var(--navigator-text, hsla(0, 0%, 100%, 0.72));
    }
  }

  .item {
    margin-right: 6px;

    &:last-of-type {
      margin-right: 0;
    }
  }

  .btn {
    cursor: pointer;
    font-size: 16px;
  }
}

.exitDemonstrateBtn {
  position: absolute;
  right: 40px;
  top: 20px;
  cursor: pointer;
  z-index: 10001;
  pointer-events: all;

  .icon {
    font-size: 28px;
    color: #fff;
  }
}

.stepBox {
  position: absolute;
  right: 40px;
  bottom: 20px;
  pointer-events: all;

  z-index: 10001;
  display: flex;
  align-items: center;

  .step {
    color: #fff;
    margin: 0 12px;
  }

  .jump {
    color: #fff;
    cursor: pointer;

    .icon {
      font-size: 16px;
      font-weight: 700;
      line-height: 1;
    }

    &.disabled {
      cursor: not-allowed;
      color: #999;
    }
  }

  .input {
    margin-left: 12px;
    display: flex;
    align-items: center;

    input {
      width: 50px;
      height: 30px;
      text-align: center;
      background-color: transparent;
      border: 1px solid #999;
      outline: none;
      color: #fff;
    }
  }
}

.speakerNotes {
  position: absolute;
  left: 40px;
  bottom: 20px;
  z-index: 10001;
  pointer-events: all;
  max-width: min(360px, calc(100vw - 220px));
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
  color: #fff;

  .speakerNotesTitle {
    font-size: 12px;
    font-weight: 600;
    opacity: 0.8;
    margin-bottom: 6px;
  }

  .speakerNotesBody {
    font-size: 13px;
    line-height: 1.5;
    max-height: 140px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-word;
  }
}
</style>
