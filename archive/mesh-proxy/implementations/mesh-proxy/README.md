# RFC mesh-proxy dotfiles (POSIX)

This is a pure dotfile set for RFC-0001. There are no scripts; `start.sh` is the only executor.

## Usage

```sh
./start.sh file.txt
```

The root dotfiles include this extension by default:

```
@include extensions/proxy-mesh/dot/.env
```

To use explicitly:

```sh
DOT_DIR=implementations/mesh-proxy/dot ./start.sh file.txt
```
