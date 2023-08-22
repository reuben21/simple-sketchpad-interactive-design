import PropTypes from 'prop-types';
import {Tooltip} from "antd";

const ToolButton = ({name, icon, onClick, tooltip,tool}) => (
    <div style={{position: "relative"}}>
        <Tooltip title={tooltip}>
            <button
                style={{
                    width: 45,
                    height: 45,
                    border: "none",
                    borderRadius: 10,
                    margin: 10,
                    backgroundColor: tool === name ? "lightblue" : "white",
                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                }}
                onClick={onClick}
            >
                {icon}
            </button>
        </Tooltip>
    </div>
);


ToolButton.propTypes = {
    name: PropTypes.string.isRequired, // Define the type and whether it's required
    icon: PropTypes.elementType.isRequired, // Define the type and whether it's required
    onClick: PropTypes.func.isRequired, // Define the type and whether it's required
    tooltip: PropTypes.string, // Define the type (not required in this case)
    tool: PropTypes.string,
};

export default ToolButton;