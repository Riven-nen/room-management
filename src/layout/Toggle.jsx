import "./Toggle.css"

function Toggle({ checked, onChange }) {
    return (
        <label className="toggle">
            <input
                type="checkbox"
                checked={checked || false}
                onChange={onChange}
            />
            <span className="toggle-slider"></span>
        </label>
    )
}

export default Toggle