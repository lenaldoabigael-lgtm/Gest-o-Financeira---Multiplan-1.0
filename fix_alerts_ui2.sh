sed -i 's/import React from '\''react'\'';/import React, { useState } from '\''react'\'';/g' components/SellerBoard.tsx

sed -i 's/const columns = \[/const [alertMessage, setAlertMessage] = useState('\'''\'');\n  const columns = \[/g' components/SellerBoard.tsx

