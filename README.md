# bunnai

have ai write commit messages for you.

## usage

### as a menu

this creates a menu of commit messages based on the diff between the current branch and master.

insert the following custom command into your [lazygit](https://github.com/jesseduffield/lazygit) config file:

```yaml
customCommands:
    - key: "a"
        description: "pick AI commit"
        command: 'git commit -m "{{.Form.Msg}}"'
        context: "files"
        prompts:
            - type: "menuFromCommand"
            title: "ai Commits"
            key: "Msg"
            command: "bun run /home/christian/projects/bunnai/index.ts"
            filter: '^(?P<number>\d+)\.\s(?P<message>.+)$'
            valueFormat: "{{ .message }}"
            labelFormat: "{{ .number }}: {{ .message | green }}"
```

### with vim

this allows you to edit the commit message in vim after the menu is created.

```yaml
customCommands:
    - key: "a"
      description: "Pick AI commit"
      command: 'echo "{{.Form.Msg}}" > .git/COMMIT_EDITMSG && vim .git/COMMIT_EDITMSG && git commit -F .git/COMMIT_EDITMSG'
      context: "files"
      subprocess: true
      prompts:
          - type: "menuFromCommand"
            title: "AI Commits"
            key: "Msg"
            command: "bun run /home/christian/projects/bunnai/index.ts"
            filter: '^(?P<number>\d+)\.\s(?P<message>.+)$'
            valueFormat: "{{ .message }}"
            labelFormat: "{{ .number }}: {{ .message | green }}"
```
