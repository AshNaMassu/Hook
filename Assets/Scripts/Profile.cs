using UnityEngine;

[CreateAssetMenu(menuName = "Hook/Profile")]
public class Profile : ScriptableObject
{
    [Header("Catch")] public float grabRadius = 1.6f, rMin = 1.2f, rMax = 3f;
    [Header("Spin")] public float wMin = 3f, wMax = 6.5f, spinAccel = 2.5f;
    [Header("Flight")] public float g = 14f, upAssist = 1f;
}