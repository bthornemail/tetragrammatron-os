import YAML from "yaml";
export function parseYaml<T>(text: string): T {
  return YAML.parse(text) as T;
}

