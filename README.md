# bunnai

have ai write commit messages for you.

## installation

```sh
bun install -g bunnai
```

## usage

### as a menu

this creates a menu of commit messages based on the diff between the current branch and master.

insert the following custom command into your [lazygit](https://github.com/jesseduffield/lazygit) config file:

```yaml
customCommands:
    - key: "<c-a>" # ctrl + a
        description: "pick AI commit"
        command: 'git commit -m "{{.Form.Msg}}"'
        context: "files"
        prompts:
            - type: "menuFromCommand"
            title: "ai Commits"
            key: "Msg"
            command: "bunx bunnai"
            filter: '^(?P<number>\d+)\.\s(?P<message>.+)$'
            valueFormat: "{{ .message }}"
            labelFormat: "{{ .number }}: {{ .message | green }}"
```

### with vim

this allows you to edit the commit message in vim after you've selected it from the menu.

```yaml
customCommands:
    - key: "<c-a>" # ctrl + a
      description: "Pick AI commit"
      command: 'echo "{{.Form.Msg}}" > .git/COMMIT_EDITMSG && vim .git/COMMIT_EDITMSG && git commit -F .git/COMMIT_EDITMSG'
      context: "files"
      subprocess: true
      prompts:
          - type: "menuFromCommand"
            title: "AI Commits"
            key: "Msg"
            command: "bunx bunnai"
            filter: '^(?P<number>\d+)\.\s(?P<message>.+)$'
            valueFormat: "{{ .message }}"
            labelFormat: "{{ .number }}: {{ .message | green }}"
```
