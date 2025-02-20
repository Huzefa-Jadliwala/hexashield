import { useState } from "react";
import { IconButton } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const usePasswordToggle = () => {
  const [visible, setVisibility] = useState(false);

  const Icon = (
    <IconButton
      onClick={() => setVisibility((visibility) => !visibility)}
      edge="end"
    >
      {visible ? <VisibilityOff /> : <Visibility />}
    </IconButton>
  );

  const InputType = visible ? "text" : "password";

  return [InputType, Icon] as const;
};

export default usePasswordToggle;